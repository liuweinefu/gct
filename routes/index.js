var express = require('express');
var router = express.Router();
var md5 = require('md5');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index');
    //res.render('index', { title: 'Express' });
});

router.post('/', function(req, res, next) {
    res.locals.xhr = true;
    //console.log(req.xhr);
    //已登录则返回user
    if (req.session.hasLogged === true) {
        res.json({
            success: true,
            message: '登录成功',
            user: req.session.user,
            menus: req.session.menus,
        });
        return;
    }

    //登录数据项不能有空项
    if (!req.body.userName) {
        return res.json({
            success: false,
            message: '用户名不能为空',
            captcha: F.captcha(req),
        });

    };
    if (!req.body.userPass) {
        return res.json({
            success: false,
            message: '密码不能为空',
            captcha: F.captcha(req),
        });

    };
    if (!req.body.captcha) {
        return res.json({
            success: false,
            message: '验证码不能为空',
            captcha: F.captcha(req),
        });
    };

    //验证码错误
    if (!req.session.captcha || req.body.captcha.toUpperCase() !== req.session.captcha.toUpperCase()) {
        return res.json({
            success: false,
            message: '验证码错误',
            captcha: F.captcha(req),
        });

    };

    let userName = req.body.userName;
    //let userPass = crypto.createHash('md5').update(req.body.userPass).digest('hex');
    let userPass = md5(req.body.userPass);

    let currentCon = null;
    mysqlPool.getConnectionAsync()
        .then(function(con) {
            currentCon = con;
            currentCon.queryAsync = Promise.promisify(currentCon.query);
            return currentCon.queryAsync('SELECT id,name,phone,other_contacts,last_login_time,remark,user_role_name,menus,privileges,base_wage,deduction_wage FROM view_user WHERE name= ? and pass = ?', [userName, userPass]);
        })
        .then(function(rows) {
            if (rows.length !== 1) { return Promise.reject(new Error('用户错误')); }
            let user = rows[0];
            let menus = [];
            let privileges = [];
            for (let i in allPrivileges) {
                if (user.menus === 'all') {
                    if (allPrivileges[i].type === 'menu') {
                        menus.push(allPrivileges[i]);
                    }
                } else if (user.menus.indexOf(allPrivileges[i].id) !== -1) {
                    menus.push(allPrivileges[i]);
                }

                if (user.privileges === 'all') {
                    privileges.push(allPrivileges[i].url);
                } else if (user.privileges.indexOf(allPrivileges[i].id) !== -1) {
                    privileges.push(allPrivileges[i].url);
                }
            }

            req.session.hasLogged = true;
            req.session.user = Object.assign({}, user); //浅层拷贝
            delete req.session.user.menus;
            delete req.session.user.privileges;
            req.session.menus = menus;
            req.session.privileges = privileges;
            return currentCon.queryAsync('UPDATE user SET last_login_time=? WHERE id= ? ', [new Date(), req.session.user.id]);
        })
        .then(function(row) {
            currentCon.release();
            if (row.changedRows !== 1) { return Promise.reject(new Error('登陆时间更新错误')); }
            res.json({
                success: true,
                message: '登录成功',
                user: req.session.user,
                menus: req.session.menus,
            });
            return;
        })
        .catch(function(err) {
            req.session.destroy(function(destoy_err) {
                // next(new Error('destroy err'));
                console.err(destoy_err);
            });
            next(err);
        });

});

router.post('/captcha', function(req, res) {
    res.json({
        captcha: F.captcha(req),
    });
});

module.exports = router;