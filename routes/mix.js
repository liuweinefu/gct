var express = require('express');
var router = express.Router();
var md5 = require('md5');


router.getCon = function(req, res, next) {
    mysqlPool.getConnection(function(err, con) {
        if (err) { next(err) };
        req.dbCon = con;
        req.dbCon.queryAsync = Promise.promisify(req.dbCon.query);
        req.dbCon.beginTransactionAsync = Promise.promisify(req.dbCon.beginTransaction);
        req.dbCon.commitAsync = Promise.promisify(req.dbCon.commit);
        req.dbCon.rollbackAsync = Promise.promisify(req.dbCon.rollback);
        next();
    });
};
router.get('/', function(req, res, next) {
    res.render('mix/index');
});
router.post('/', router.getCon, function(req, res, next) {
    if (req.body.name.trim() === '' || req.body.value.trim() === '') {
        req.session.currentMember = {};
        res.json({
            err: true,
            message: '搜索数据不能为空'
        });
        return;
    }

    req.dbCon.queryAsync('SELECT id,name,pass,balance,phone,other_contacts,remark,member_role_name,member_case FROM view_member WHERE ' + mysqlPool.escapeId(req.body.name) + ' like "%' + req.body.value.trim() + '%"')
        .then(function(row) {
            if (row.length === 1) {
                req.session.currentMember = row[0];
                res.json({
                    err: false,
                });
            } else if (row.length > 1) {
                req.session.currentMember = {};
                res.json({
                    err: true,
                    message: '有效用户' + row.length + '人: </br> ' + (row.reduce(function(names, item) {
                        return names + '</br>' + item.name;
                    }, '')).slice(5, -1),
                });
            } else {
                req.session.currentMember = {};
                res.json({
                    err: true,
                    message: '无有效用户'
                });
            }

        })
        .catch(function(err) {
            next(err);
        })
        .finally(function() {
            req.dbCon.release();
        });
});

router.post('/check', router.getCon, function(req, res, next) {

    if (req.session.currentMember === undefined || req.session.currentMember.id === undefined) {
        res.json({
            err: true,
            message: '无有效用户'
        });
        return;
    };

    if (req.session.currentMember.pass && md5(req.body.pass.trim()) !== req.session.currentMember.pass) {
        res.json({
            err: true,
            message: '密码错误'
        });
        return;
    }

    let member = [];
    member.push(['用户名', req.session.currentMember.name]);
    member.push(['用户类型', req.session.currentMember.member_role_name]);
    member.push(['余额', req.session.currentMember.balance]);
    member.push(['电话', req.session.currentMember.phone]);
    member.push(['其他联系方式', req.session.currentMember.other_contacts]);
    member.push(['备注', req.session.currentMember.remark]);

    req.dbCon.queryAsync('SELECT id,name,price,count FROM commodity ORDER BY id; SELECT id,name FROM user WHERE name!="admin" ORDER BY name')
        .then(function(row) {
            if (row[0].length < 1 || row[1].length < 1) {
                res.json({
                    err: true,
                    message: '初始化错误'
                });
            } else {
                res.json({
                    err: false,
                    member: member,
                    commodity: row[0],
                    user: row[1]
                });
            }
        })
        .catch(function(err) {
            next(err);
        })
        .finally(function() {
            req.dbCon.release();
        });

});

router.post('/recharge', router.getCon, function(req, res, next) {
    if (req.session.currentMember === undefined || req.session.currentMember.id === undefined) {
        res.json({
            err: true,
            message: '无有效用户'
        });
        return;
    };
    if (req.body.value * 100 <= 0) {
        res.json({
            err: true,
            message: '充值金额必须大于0'
        });
        return;
    };
    let rechargeRecord = [];
    rechargeRecord.push(['member_id', req.session.currentMember.id]);
    rechargeRecord.push(['member_name', req.session.currentMember.name]);
    rechargeRecord.push(['write_user_id', req.session.user.id]);
    rechargeRecord.push(['write_user_name', req.session.user.name]);
    rechargeRecord.push(['recharge_price', req.body.value * 100 / 100]);

    let queries = [];
    queries.push('UPDATE member SET balance=balance+' + mysqlPool.escape(req.body.value) + ' WHERE id=' + mysqlPool.escape(req.session.currentMember.id));
    queries.push('INSERT INTO member_recharge (' + rechargeRecord.map(function(item) { return item[0]; }).join(',') + ') VALUES (' + rechargeRecord.map(function(item) { return '"' + item[1] + '"'; }).join(',') + ')');
    queries.push('SELECT balance FROM member WHERE id=' + mysqlPool.escape(req.session.currentMember.id));

    req.dbCon.beginTransactionAsync()
        .then(function() {
            return req.dbCon.queryAsync(queries.join(';'));
        })
        .then(function(rows) {
            res.json({
                err: false,
                message: '充值完成!</br>本次充值:' + req.body.value + '元</br>会员余额:' + rows[2][0].balance + '元',
                balance: rows[2][0].balance
            });
            req.dbCon.commitAsync();
        })
        .catch(function(err) {
            req.dbCon.rollbackAsync();
            next(err);
        })
        .finally(function() {
            req.dbCon.release();
        });
});

router.post('/pay', router.getCon, function(req, res, next) {
    req.body = JSON.parse(req.body.value);


    let balance = 0;
    req.dbCon.beginTransactionAsync()
        .then(function() {
            //返回一个promise数组
            return req.body.map(function(item) {
                //处理每条记录
                let consumption = Object.assign({}, item);
                let queries = [];
                queries.push('SELECT id,name,count,price FROM commodity WHERE id=' + mysqlPool.escape(item.commodity_id));
                queries.push('SELECT id,name,balance FROM member WHERE id=' + mysqlPool.escape(req.session.currentMember.id));
                queries.push('SELECT id,name FROM user WHERE id=' + mysqlPool.escape(item.service_user_id));
                return req.dbCon.queryAsync(queries.join(';'))
                    .then(function(row) {
                        if (row[0][0].count - item.count < 0) {
                            return Promise.reject({ message: '库存不足' });
                        };
                        consumption.commodity_id = row[0][0].id;
                        consumption.commodity_name = row[0][0].name;
                        consumption.commodity_price = row[0][0].price * 100 / 100;

                        balance = row[1][0].balance;
                        if (!item.is_cash && row[1][0].balance - item.price * 100 / 100 < 0) {
                            return Promise.reject({ message: '会员余额不足' });
                        } else {
                            balance = row[1][0].balance - item.price * 100 / 100;
                        }

                        consumption.service_user_id = row[2][0].id;
                        consumption.service_user_name = row[2][0].name;

                        consumption.member_id = req.session.currentMember.id;
                        consumption.member_name = req.session.currentMember.name;

                        consumption.write_user_id = req.session.user.id;
                        consumption.write_user_name = req.session.user.name;
                        return true;

                    })
                    .then(function() {
                        let queries = [];

                        queries.push('INSERT INTO member_consumption (' + Object.keys(consumption).join(',') + ') VALUES (' + Object.keys(consumption).map(function(key) { return '"' + consumption[key] + '"'; }).join(',') + ')');
                        queries.push('UPDATE commodity SET count=count-1 WHERE id=' + mysqlPool.escape(item.commodity_id));
                        queries.push('UPDATE member SET balance=balance-' + item.price + ' WHERE id=' + mysqlPool.escape(req.session.currentMember.id));
                        if (item.is_cash) {
                            queries.pop();
                        }
                        return req.dbCon.queryAsync(queries.join(';'))
                    })


            })

        })
        .then(function(PromiseArray) {
            return Promise.all(PromiseArray)
        })
        .then(function(value) {

            res.json({
                err: false,
                message: '结算完成;会员余额:' + balance + '元',
            });
            req.dbCon.commitAsync();
        })
        .catch(function(err) {
            req.dbCon.rollbackAsync();
            next(err);
        })
        .finally(function() {
            req.dbCon.release();
        });

});

module.exports = router;