var getRouter = require('./baseRouter');



var router = getRouter({
    routerName: __filename,
    //importAble: true,
    //exportAble: true,
    exportExcelFields: ['id', 'name'], //array
    dbTable: 'commodity_type', //db or view
    //changeAble 为 true，才会检测emptyAble 为false ,才会调用checkEmpty
    fieldsMap: new Map()
        .set('id', {
            changeAble: false, //默认true
            emptyAble: false, //默认ture
            //checkEmpty: function() {},  //根据formatter定义，如不在string,int,float,pass 范围呢 则定义function(value);
            formatter: 'int', // string,int,float,pass or function(value);
        })
        .set('name', {
            //changeAble: true,  //默认true
            emptyAble: false,
            //checkEmpty: function() {},
            formatter: 'string',

        }),
});


module.exports = router;