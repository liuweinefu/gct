var setRouter = require('./baseRouter');
var router = setRouter({
    routerName: __filename,
    exportExcelFields: ['id', 'name'],
    dbTable: 'view_useruser', //'user'
    fieldsMap: _fieldsMap,
    //dbView: 'view_user', //'view_user'
});
var _fieldsMap = new Map();
_fieldsMap.set('id', {
    updateAble: false,
    formatter: 'number'
});

_fieldsMap.set('name', {
    updateAble: true,
    formatter: 'string'
});
// var express = require('express');
// var router = express.Router();
module.exports = router;