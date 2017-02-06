var express = require('express');
var router = express.Router();
var multiparty = require('multiparty');
var fs = require("fs");

router.get('/', function(req, res, next) {
    res.render('uploadPic');

});

router.post('/', function(req, res, next) {
    var form = new multiparty.Form({ uploadDir: './public/tmp/' });

    form.parse(req, function(err, fields, files) {
        if (err) { next(err); };
        console.log(files.files[0].originalFileName);

        // fs.rename(files.upload[0].path, './public/memberCase/leftPic.jpg', function(err) {
        //     if (err) { next(err); };
        //     res.json({
        //         err: false,
        //         message: '上传成功'

        //     });
        // });

        // console.log(fields);
        // console.log(files.originalFilename);
        // console.log(files.path);
    });






});

module.exports = router;