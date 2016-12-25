var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    console.log('req.xhr:' + req.xhr);
    res.locals.xhr = req.xhr;
    res.locals.xhr = true;
    console.log('req.xhr:' + res.locals.xhr);
    //res.render('index', { title: 'Express' });
});

module.exports = router;