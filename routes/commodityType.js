var getRouter = require('./baseRouter');

var config = {};
var router = {};
[config, router] = getRouter({
    routerName: __filename,
    //importAble: true,
    //exportAble: true,
    exportExcelFields: ['id', 'name'], //array
    dbTable: 'commodity_type', //db or view
    //readonly 为 true，才会检测nullable 为false ,才会调用checkEmpty
    fieldsMap: new Map()
        .set('id', {
            readonly: false, //默认true
            nullable: false, //默认ture
            formatter: 'int', // string,int,float,pass or function(key,value) return[err,value];
        })
        .set('name', {
            //readonly: true,  //默认true
            nullable: false,
            formatter: 'string',
        }),
});

// router.get('/abc', function(req, res, next) {
//     console.log(config.fieldsMap);
//     next();
// });


module.exports = router;