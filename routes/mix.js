var express = require('express');
var router = express.Router();
var md5 = require('md5');


router.getCon = function(req, res, next) {
    mysqlPool.getConnection(function(err, con) {
        if (err) { next(err) };
        req.dbCon = con;
        req.dbCon.queryAsync = Promise.promisify(req.dbCon.query);
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

    req.dbCon.queryAsync('SELECT id,name,pass,phone,other_contacts,remark,member_role_name,member_case FROM view_member WHERE ' + mysqlPool.escapeId(req.body.name) + ' like "%' + req.body.value.trim() + '%"')
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

    }

    if (!req.session.currentMember.pass) {
        res.json({
            err: false,
        });
        return;
    }

    if (md5(req.body.pass.trim()) !== req.session.currentMember.pass) {
        res.json({
            err: true,
            message: '密码错误'
        });
        return;
    }
    res.json({
        err: false,
    });

});

module.exports = router;