var express = require('express');
var router = express.Router();
var md5 = require('md5');
var svgCaptcha = require('svg-captcha');



function captcha(req) {
    let captcha = svgCaptcha.create({
        size: 4, // 驗證碼長度
        ignoreChars: '01oOiIlL', // 驗證碼字符中排除 01oOiIlL
        noise: 1, // 干擾綫條的數量
        color: true, // 驗證碼的字符有顔色
        //background: '#cc9966' // 驗證碼圖片背景顔色
    });
    req.session.captcha = captcha.text;
    return captcha.data;
};


/* GET home page. */
router.get('/', function(req, res, next) {
    //res.send(req.path);
    res.render('index');
    //res.render('index', { title: 'Express' });
});

//第一次层过滤
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
    };

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
    next();
});

//第二次层过滤+赋值
getCon = function(req, res, next) {
    mysqlPool.getConnection(function(err, con) {
        if (err) { next(err) };
        req.dbCon = con;
        req.dbCon.queryAsync = Promise.promisify(req.dbCon.query);
        next();
    });
};

router.post('/', getCon, function(req, res, next) {
    let userName = req.body.userName;
    let userPass = md5(req.body.userPass);
    req.dbCon.queryAsync('SELECT id,name,phone,other_contacts,last_login_time,remark,user_role_name,privileges,menus,tabs,base_wage FROM view_user WHERE name= ? and pass = ?', [userName, userPass])
        .then(function(rows) {
            if (rows.length !== 1) {
                //return Promise.reject(new Error('用户错误'));
                req.dbCon.release();
                res.json({
                    err: true,
                    message: '用户错误',
                    captcha: captcha(req),
                });
            } else {
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
                delete user.menus;
                delete user.privileges;
                delete user.tabs;
                req.session.user = user;
                req.session.privileges = privileges;
                req.session.menus = menus;
                req.session.tabs = tabs;
                next();
            }
        });

});

router.post('/', function(req, res, next) {
    req.dbCon.queryAsync('UPDATE user SET last_login_time=? WHERE id= ? ', [new Date(), req.session.user.id])
        .then(function(row) {
            req.dbCon.release();
            if (row.changedRows !== 1) {
                res.json({
                    err: true,
                    message: '登陆时间更新错误',
                    captcha: captcha(req),
                });
                req.session.destroy();
            } else {
                res.json({
                    err: false,
                    message: '登录成功',
                    user: req.session.user,
                    menus: req.session.menus,
                    tabs: req.session.tabs,
                });
            }
        });
});




router.post('/captcha', function(req, res) {
    res.json({
        captcha: captcha(req),
    });
});

router.get('/logout', function(req, res, next) {
    req.session.destroy();
    res.render('logout');
});


module.exports = router;