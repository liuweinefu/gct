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
    let query = '';
    if (req.body.isStrict === "true") {
        query = 'SELECT id,card_id,name,pass,balance,phone,other_contacts,remark,member_role_name,member_case,discount,member_case_remark FROM view_member WHERE ' + mysqlPool.escapeId(req.body.name) + ' = "' + req.body.value.trim() + '"';
    } else {
        query = 'SELECT id,card_id,name,pass,balance,phone,other_contacts,remark,member_role_name,member_case,discount,member_case_remark FROM view_member WHERE ' + mysqlPool.escapeId(req.body.name) + ' like "%' + req.body.value.trim() + '%"';
    }

    req.dbCon.queryAsync(query)
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
    member.push(['会员名', req.session.currentMember.name]);
    member.push(['会员卡号', req.session.currentMember.card_id]);
    member.push(['用户类型', req.session.currentMember.member_role_name]);
    member.push(['折扣率', req.session.currentMember.discount * 100 + '%']);
    member.push(['余额', '￥' + req.session.currentMember.balance]);

    member.push(['电话', req.session.currentMember.phone]);
    member.push(['其他联系方式', req.session.currentMember.other_contacts]);
    member.push(['备注', req.session.currentMember.remark]);

    req.dbCon.queryAsync('SELECT id,name,price FROM commodity ORDER BY name; SELECT id,name FROM user WHERE name!="admin" ORDER BY name')
        .then(function(row) {
            if (row[0].length < 1 || row[1].length < 1) {
                res.json({
                    err: true,
                    message: '初始化错误'
                });
            } else {
                req.session.allCommodity = row[0];
                req.session.allUser = row[1];
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
            if (rows[0].affectedRows != 1 || rows[1].affectedRows != 1) {
                throw new Error('充值失败!update or insert Error');
                return;
            }
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


    req.dbCon.beginTransactionAsync()
        .then(function() {

            return Promise.reduce(req.body, function(total, item) {
                let consumption = Object.assign({}, item);

                let queries = [];
                queries.push('SELECT id,name,count,price FROM commodity WHERE id=' + mysqlPool.escape(consumption.commodity_id));
                queries.push('SELECT balance FROM member WHERE id=' + mysqlPool.escape(req.session.currentMember.id));
                queries.push('SELECT id,name FROM user WHERE id=' + mysqlPool.escape(consumption.service_user_id));
                return req.dbCon.queryAsync(queries.join(';'))
                    .then(function(row) {

                        consumption.count = Number.parseInt(consumption.count);
                        if (Number.isNaN(consumption.count) || consumption.count === 0) {
                            return Promise.reject({ message: row[0][0].name + '消费数量无效' });
                        };
                        if (row[0][0].count - consumption.count < 0) {
                            return Promise.reject({ message: row[0][0].name + '库存不足' });
                        };

                        consumption.commodity_id = row[0][0].id;
                        consumption.commodity_name = row[0][0].name;
                        consumption.commodity_price = row[0][0].price * 100 / 100;



                        consumption.price = consumption.commodity_price * consumption.count;
                        if (consumption.is_discount == '1') {
                            consumption.price = consumption.price * req.session.currentMember.discount;
                        };

                        // console.log('balance:' + row[1][0].balance);
                        // if (consumption.is_cash != '1' && row[1][0].balance - consumption.price < 0) {
                        //     return Promise.reject({ message: '会员余额不足' });
                        // };

                        consumption.service_user_id = row[2][0].id;
                        consumption.service_user_name = row[2][0].name;

                        consumption.member_id = req.session.currentMember.id;
                        consumption.member_name = req.session.currentMember.name;

                        consumption.write_user_id = req.session.user.id;
                        consumption.write_user_name = req.session.user.name;

                        let queries = [];
                        queries.push('INSERT INTO member_consumption (' + Object.keys(consumption).join(',') + ') VALUES (' + Object.keys(consumption).map(function(key) { return '"' + consumption[key] + '"'; }).join(',') + ')');
                        queries.push('UPDATE commodity SET count=count-' + consumption.count + ' WHERE id=' + mysqlPool.escape(item.commodity_id));
                        queries.push('UPDATE member SET balance=balance-' + consumption.price + ' WHERE id=' + mysqlPool.escape(req.session.currentMember.id));

                        if (consumption.is_cash == '1') {
                            queries.pop();
                        }
                        return req.dbCon.queryAsync(queries.join(';'))
                    })
                    .then(function(row) {
                        return total = total + 1;
                    });



            }, 0);

        })
        .then(function(value) {
            return req.dbCon.queryAsync('SELECT balance FROM member WHERE id=' + mysqlPool.escape(req.session.currentMember.id))
        })
        .then(function(row) {
            let message = '';
            if (row[0].balance < 0) {
                message = '!!!余额为负值!!!结算完成;会员余额:<b>' + row[0].balance + '</b>元';
            } else {
                message = '结算完成;会员余额:<b>' + row[0].balance + '</b>元';
            }

            res.json({
                err: false,
                message: message,
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

router.post('/listMemberRole', router.getCon, function(req, res, next) {

    req.dbCon.queryAsync('SELECT id,name,discount,remark FROM member_role ORDER BY discount desc')
        .then(function(rows) {

            req.session.memberRole = rows;

            res.json(rows.map(function(item) {
                let backObject = {};
                backObject.id = item.id;
                //backObject.name = item.name + '(' + Number.parseInt(item.discount * 100) + '%--' + item.remark + ')';
                backObject.name = item.name;
                return backObject;
            }));
        })
        .catch(function(err) {
            next(err);
        })
        .finally(function() {
            req.dbCon.release();
        });

});

router.post('/addNewMember', router.getCon, function(req, res, next) {
    let newMember = [];
    //card_id
    if (req.body.card_id === undefined || req.body.card_id.length > 30 || Number.isNaN(Number.parseInt(req.body.card_id))) {
        res.json({
            err: true,
            message: '用户卡号错误'
        });
        return;
    } else {
        newMember.push(['card_id', Number.parseInt(req.body.card_id)]);
    };
    //name
    if (req.body.name === undefined || req.body.name.length < 2 || req.body.name.length > 30) {
        res.json({
            err: true,
            message: '用户名错误'
        });
        return;
    } else {
        newMember.push(['name', req.body.name]);
    };

    //pass
    if (req.body.pass === undefined) {
        res.json({
            err: true,
            message: '密码错误'
        });
        return;
    };
    if (req.body.pass.length !== 0 && (req.body.pass.length < 6 || req.body.name.length > 30)) {
        res.json({
            err: true,
            message: '密码错误'
        });
        return;
    } else if (req.body.pass.length === 0) {
        newMember.push(['pass', '']);
    } else {
        newMember.push(['pass', md5(req.body.pass)]);
    };

    //member_role_id
    if (req.body.member_role_id === undefined || req.session.memberRole.findIndex(function(item) { return item.id == req.body.member_role_id }) === -1) {
        res.json({
            err: true,
            message: '用户角色错误'
        });
        return;
    } else {
        newMember.push(['member_role_id', req.body.member_role_id]);
    };

    //phone
    if (req.body.phone === undefined || Number.isNaN(Number.parseInt(req.body.phone)) || req.body.phone.length !== 11) {
        res.json({
            err: true,
            message: '电话错误'
        });
        return;
    } else {
        newMember.push(['phone', Number.parseInt(req.body.phone)]);
    };

    newMember.push(['other_contacts', req.body.other_contacts]);
    newMember.push(['remark', req.body.remark]);


    let query = 'INSERT INTO member (' + newMember.map(function(item) { return item[0]; }).join(',') + ') VALUES (' + newMember.map(function(item) { return '"' + item[1] + '"'; }).join(',') + ')';

    req.dbCon.queryAsync(query)
        .then(function(rows) {

            res.json({
                err: false,
                message: '用户添加成功'
            });
        })
        .catch(function(err) {
            next(err);
        })
        .finally(function() {
            req.dbCon.release();
        });

});



module.exports = router;