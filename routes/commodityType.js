var getRouter = require('./baseRouter');



var router = getRouter({
    routerName: __filename,
    //importAble: true,
    //exportAble: true,
    exportExcelFields: ['id', 'name'], //array
    dbTable: 'commodity_type', //db or view
    fieldsMap: new Map()
        .set('id', {
            updateAble: false,
            formatter: 'int', // string,int,float,pass or function(value);
        })
        .set('name', {
            updateAble: true,
            formatter: 'string',
            //defaultValue: '新' + new Date(),
            //noEmpty:true,
        }),
});


module.exports = router;