// var express = require('express');
// var router = express.Router();
var createRouter = require('./baseRouter');



var config = {
    routerName: __filename,
    //multiData: true,
    //singleData: true,
    mainIndex: 'multi', //multi or single
    importAble: true,
    exportAble: true,
    exportExcelFields: ['id', 'name'], //array
    dbTable: 'commodity_type', //db or view
    //readonly 为 true，才会检测nullable 为false ,才会调用checkEmpty
    fieldsMap: new Map()
        .set('id', {
            readonly: true, //默认false
            nullable: false, //默认ture
            formatter: 'int', // string,int,float,pass or function(key,value) return[err,value];
        })
        .set('name', {
            //readonly: false,  //默认false
            nullable: false, //默认ture
            formatter: 'string',
        }),
};


var router;
[config, router] = createRouter(config);


//router的特例设置


// router.get('/abc', function(req, res, next) {
//     console.log(config.fieldsMap);
//     next();
// });


module.exports = router;