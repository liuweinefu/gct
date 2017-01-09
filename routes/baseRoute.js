var express = require('express');
var router = express.Router();
var md5 = require('md5');
var xlsx = require('node-xlsx').default;

var getFileName = function(fileName, needPath) {
    needPath = typeof needPath === 'boolean' ? needPath : false;

    let backFileName = '';
    let backPathName = '';

    if (fileName.lastIndexOf('\\') !== -1) {
        backFileName = fileName.substr(fileName.lastIndexOf('\\') + 1, fileName.lastIndexOf('.') - fileName.lastIndexOf('\\') - 1);
        backPathName = '.\\' + backFileName + '.\\';
    }
    if (fileName.lastIndexOf('/') !== -1) {
        backFileName = fileName.substr(fileName.lastIndexOf('/') + 1, fileName.lastIndexOf('.') - fileName.lastIndexOf('/') - 1);
        backPathName = './' + backFileName + '/';
    }

    if (backFileName === '') { return backFileName; }
    if (needPath) {
        return backPathName;
    } else {
        return backFileName;
    }
}


baseSet = {};

router.get('/', function(req, res, next) {

    res.render(getFileName(baseSet.fileName, needPath) + 'index');
});









module.exports = function(configer) {

    return router;
}