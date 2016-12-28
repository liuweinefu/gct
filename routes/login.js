var express = require('express');
var router = express.Router();
var md5 = require('md5');

//GET login操作模板
router.get(function(req, res) {
    res.redirect('/');
})



//根据post内容进行认证
router.post('/', function(req, res, next) {
    //已登录则返回user
    if (req.session.isLogin === true) {
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
                req.session.isLogin = true;
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


// function _captcha(req) {
//     let captcha = svgCaptcha.create({
//         size: 4, // 驗證碼長度
//         ignoreChars: '0o1il', // 驗證碼字符中排除 0o1il
//         noise: 1, // 干擾綫條的數量
//         color: true, // 驗證碼的字符有顔色
//         //background: '#cc9966' // 驗證碼圖片背景顔色
//     });
//     req.session.captcha = captcha.text;
//     return captcha.data;
// };

router.post('/captcha', function(req, res) {
    res.json({
        captcha: F.captcha(req),
    });
});


//*************************************************************
//var svgCaptcha = require('svg-captcha');
// router.get('/captcha', function(req, res) {
//     var captcha = svgCaptcha.create({
//         size: 4, // 驗證碼長度
//         ignoreChars: '0o1il', // 驗證碼字符中排除 0o1il
//         noise: 1, // 干擾綫條的數量
//         color: true, // 驗證碼的字符有顔色
//         //background: '#cc9966' // 驗證碼圖片背景顔色
//     });
//     req.session.captcha = captcha.text;
//     res.set('Content-Type', 'image/svg+xml');
//     res.status(200).send(captcha.data);
// });
//*************************************************************

module.exports = router;