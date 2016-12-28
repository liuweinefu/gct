var express = require('express');
var router = express.Router();
var md5 = require('md5');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.locals.closeLoginDialog = true;
    if (req.session.hasLogged !== true) {
        res.locals.closeLoginDialog = false;
        res.render('index', {
            captchaPIC: F.captcha(req),
        });
    } else {
        res.render('index');
    }
    //res.render('index', { title: 'Express' });

});

router.post('/', function(req, res, next) {
    //已登录则返回user
    if (req.session.hasLogged === true) {
        return res.json({
            success: true,
            message: '登录成功',
            user: {
                name: req.session.user.name,
                role: req.session.user.role_name
            },
            menus: req.session.menus
        });
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
    if (req.body.captcha.toUpperCase() !== req.session.captcha.toUpperCase()) {
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
    return mysqlPool.getConnectionAsync()
        .then(function(con) {
            currentCon = con;
            currentCon.queryAsync = Promise.promisify(currentCon.query);
            return currentCon.queryAsync('SELECT id,name,role_id,role_name,phone,other_contacts,remark,last_login_time,menus,privileges FROM view_user_role WHERE name= ? and pass = ?', [userName, userPass]);
        })
        .then(function(rows) {
            currentCon.release();
            if (rows.length !== 1) {
                return Promise.reject(new Error('view_user_role'));
            } else {
                let role = rows[0];
                let menus = [];
                let privileges = [];
                for (let i in allPrivileges) {
                    if (role.menus === 'all') {
                        if (allPrivileges[i].type === 'menu') {
                            menus.push(allPrivileges[i]);
                        }
                    } else if (role.menus.indexOf(allPrivileges[i].id) !== -1) {
                        menus.push(allPrivileges[i]);
                    }

                    if (role.privileges === 'all') {
                        privileges.push(allPrivileges[i].url);
                    } else if (role.privileges.indexOf(allPrivileges[i].id) !== -1) {
                        privileges.push(allPrivileges[i].url);
                    }
                }

                req.session.menus = menus;
                req.session.privileges = privileges;
                req.session.hasLogged = true;
                return res.json({
                    success: true,
                    message: '登录成功',
                    user: {
                        name: req.session.user.name,
                        role: req.session.user.role_name
                    },
                    menus: req.session.menus,
                });
            }

        })
        .catch(function(err) {
            next(err);
        });

});

router.post('/captcha', function(req, res) {
    res.json({
        captcha: F.captcha(req),
    });
});

module.exports = router;