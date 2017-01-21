var express = require('express');
var router = express.Router();
var md5 = require('md5');
var svgCaptcha = require('svg-captcha');



function captcha(req) {
    let captcha = svgCaptcha.create({
        size: 4, // 驗證碼長度
        ignoreChars: '0o1il', // 驗證碼字符中排除 0o1il
        noise: 1, // 干擾綫條的數量
        color: true, // 驗證碼的字符有顔色
        //background: '#cc9966' // 驗證碼圖片背景顔色
    });
    req.session.captcha = captcha.text;
    return captcha.data;
};
/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index');
    //res.render('index', { title: 'Express' });
});

router.post('/', function(req, res, next) {
    //已登录则返回user
    if (req.session.hasLogged === true) {
        res.json({
            err: false,
            message: '登录成功',
            user: req.session.user,
            menus: req.session.menus,
            tabs: req.session.tabs,
        });
        return;
    }

    //登录数据项不能有空项
    if (!req.body.userName) {
        res.json({
            err: true,
            message: '用户名不能为空',
            captcha: captcha(req),
        });
        return;

    };
    if (!req.body.userPass) {
        res.json({
            err: true,
            message: '密码不能为空',
            captcha: captcha(req),
        });
        return;
    };
    if (!req.body.captcha) {
        res.json({
            err: true,
            message: '验证码不能为空',
            captcha: captcha(req),
        });
        return;
    };

    //验证码错误
    if (!req.session.captcha || req.body.captcha.toUpperCase() !== req.session.captcha.toUpperCase()) {
        res.json({
            err: true,
            message: '验证码错误',
            captcha: captcha(req),
        });
        return;

    };

    let userName = req.body.userName;
    //let userPass = crypto.createHash('md5').update(req.body.userPass).digest('hex');
    let userPass = md5(req.body.userPass);

    let currentCon = null;
    mysqlPool.getConnectionAsync()
        .then(function(con) {
            currentCon = con;
            currentCon.queryAsync = Promise.promisify(currentCon.query);
            return currentCon.queryAsync('SELECT id,name,phone,other_contacts,last_login_time,remark,user_role_name,privileges,menus,tabs,base_wage,deduction_wage FROM view_user WHERE name= ? and pass = ?', [userName, userPass]);
        })
        .then(function(rows) {
            if (rows.length !== 1) { return Promise.reject(new Error('用户错误')); }
            let user = Object.assign({}, rows[0]); //浅层拷贝
            user.privileges = user.privileges.split(',');
            user.menus = user.menus.split(',');
            user.tabs = user.tabs.split(',');
            let privileges = [];
            let menus = [];
            let tabs = [];
            for (let i in allPrivileges) {
                // if (user.privileges === 'all') {
                //     privileges.push(allPrivileges[i].url);
                // } else if (user.privileges.indexOf(allPrivileges[i].id) !== -1) {
                //     privileges.push(allPrivileges[i].url);
                // }
                if (user.privileges.indexOf(allPrivileges[i].id.toString()) !== -1) {
                    privileges.push(allPrivileges[i].url);
                }

                // if (user.menus === 'all') {
                //     if (allPrivileges[i].type === 'menu') {
                //         menus.push(allPrivileges[i]);
                //     }
                // } else if (user.menus.indexOf(allPrivileges[i].id) !== -1) {
                //     menus.push(allPrivileges[i]);
                // }
                if (user.menus.indexOf(allPrivileges[i].id.toString()) !== -1) {
                    menus.push(allPrivileges[i]);
                }


                if (user.tabs.indexOf(allPrivileges[i].id.toString()) !== -1) {
                    tabs.push(allPrivileges[i]);
                }

            }

            req.session.hasLogged = true;
            req.session.user = user;
            delete req.session.user.menus;
            delete req.session.user.privileges;
            delete req.session.user.tabs;
            req.session.privileges = privileges;
            req.session.menus = menus;
            req.session.tabs = tabs;
            return currentCon.queryAsync('UPDATE user SET last_login_time=? WHERE id= ? ', [new Date(), req.session.user.id]);
        })
        .then(function(row) {
            currentCon.release();
            if (row.changedRows !== 1) { return Promise.reject(new Error('登陆时间更新错误')); }
            res.json({
                err: false,
                message: '登录成功',
                user: req.session.user,
                menus: req.session.menus,
                tabs: req.session.tabs,
            });
            return;
        })
        .catch(function(err) {
            req.session.destroy(function(destoy_err) {
                next(new Error('destroy err'));
                //console.err(destoy_err);
            });
            next(err);
        });

});

router.post('/captcha', function(req, res) {
    res.json({
        captcha: captcha(req),
    });
});

module.exports = router;