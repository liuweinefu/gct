var setRouter = require('./baseRouter');
var router = setRouter({
    routerName: __filename,
    exportExcelFields: ['id', 'name'],
    dbTable: 'user', //'user'
    dbView: 'view_user', //'view_user'
});
// var express = require('express');
// var router = express.Router();
module.exports = router;