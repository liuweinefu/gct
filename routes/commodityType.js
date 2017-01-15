var setRouter = require('./baseRouter');
var router = setRouter({
    routerName: __filename,
    exportExcelFields: ['id', 'name'],
    dbTable: 'view_useruser', //'user'
    fieldsMap: new Map(),
    //dbView: 'view_user', //'view_user'
});
router.fieldsMap.set('id', {
    updateAble: false,
    formatter: 'number'
});
router.fieldsMap.set('name', {
    updateAble: true,
    formatter: 'string'
});
// var express = require('express');
// var router = express.Router();
module.exports = router;