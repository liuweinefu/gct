var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');

//项目添加******************************************************************
global.Promise = require('bluebird');
global.mysqlPool = require('mysql').createPool(require('./config').db);
mysqlPool.getConnectionAsync = Promise.promisify(mysqlPool.getConnection);
//global.F = require('./baseFunction');
global.allPrivileges = [];
//项目添加******************************************************************


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));
//提高上传数据单文件大小
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));

app.use(cookieParser());
app.use(session({
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    secret: 'keyboard cat'
}));
app.use(express.static(path.join(__dirname, 'public')));




//初始化allPrivileges 及 xhr检测***************************************************************
app.use(function(req, res, next) {
    if (allPrivileges.length === 0) {
        mysqlPool.getConnection(function(err, con) {
            con.query('SELECT id,name,url,type FROM privilege', function(err, rows) {
                con.release();
                if (err) { next(new Error('权限初始化错误')) };
                allPrivileges = rows;
                next();
            });
        });
    } else {
        next();
    }
});

app.use(function(req, res, next) {
    //req.xhr不能完全判断是否ajax请求，在之后的ajax请求处理时，强制约定设置res.locals.xhr
    res.locals.xhr = req.xhr;
    next();
})
app.post('/', function(req, res, next) {
    //默认设置所有post都是Ajax操作
    res.locals.xhr = true;
    next();
});

//初始化allPrivileges 及 xhr检测***************************************************************

//登录权限检测***************************************************************
app.use(function(req, res, next) {
    // console.log("check login-----------start");
    // console.log(req.path);
    // console.log("check login-----------end");
    if (['/', '/login', '/logout'].indexOf(req.path) !== -1) {
        return next();
    }

    // if (F.isNotSet(req.session.local) ||
    //     F.isNotSet(req.session.local.privilegs) ||
    //     (req.session.local.privilegs.indexOf(req.path) === -1)) {
    if (!Array.isArray(req.session.privilegs) || req.session.privilegs.indexOf(req.path) === -1) {
        //return next(new Error('权限错误'));
        return next();
    } else {
        return next();
    }

});
//登录权限检测***************************************************************


// //登录模块***************************************************************
// var login = require('./routes/login');
// app.use('/login', login);
// app.use('/logout', function(req, res, next) {
//     req.session.destroy(function(err) {
//         next(new Error('logout err'));
//         // cannot access session here
//     });
//     // req.session.local = null;
//     res.redirect('/');
// });
// //登录模块***************************************************************




var index = require('./routes/index');
var privilege = require('./routes/privilege');
//var user = require('./routes/user');
var userRole = require('./routes/userRole');
var member = require('./routes/member');
var memberRole = require('./routes/memberRole');
var commodity = require('./routes/commodity');
var commodityType = require('./routes/commodityType');




app.use('/', index);
app.use('/privilege', privilege);
//app.use('/user', user);
app.use('/userRole', userRole);
app.use('/member', member);
app.use('/memberRole', memberRole);
app.use('/commodity', commodity);
app.use('/commodityType', commodityType);







// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

//xhr模式回复错误
app.use(function(err, req, res, next) {
    if (req.xhr || res.locals.xhr) {
        return res.json({
            err: true,
            message: err.message,
            error: req.app.get('env') === 'development' ? err : {}
        });
    }
    next(err);
});


// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;