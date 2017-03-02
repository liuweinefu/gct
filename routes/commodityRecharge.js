var createRouter = require('./baseRouter');



var config = {
    routerName: __filename,
    multiData: true,
    //singleData: true,
    exportAble: true, //boolean 
    exportExcelFields: ['id', 'commodity_id', 'commodity_name', 'commodity_count', 'commodity_price', 'create_time', 'recharge_count', 'recharge_single_price', 'recharge_all_price', 'remark'], //array
    mainIndex: 'multi', //multi or single
    dbTable: 'commodity_recharge', //db or view
    orderFields: ['create_time'],
    orderMode: 'DESC',
    //readonly 为 true，才会检测nullable 为false ,才会调用checkEmpty
    fieldsMap: new Map()
        .set('id', {
            readonly: true, //默认false
        })
        .set('commodity_id', {
            readonly: true, //默认false
        })
        .set('commodity_name', {
            readonly: true, //默认false
        })
        .set('commodity_count', {
            readonly: true, //默认false
        })
        .set('commodity_price', {
            readonly: true, //默认false
        })
        .set('create_time', {
            readonly: true, //默认false
        })
        .set('recharge_count', {
            readonly: true, //默认false
        })
        .set('recharge_single_price', {
            readonly: true, //默认false
        })
        .set('recharge_all_price', {
            readonly: true, //默认false
        })
        .set('remark', {
            readonly: false, //默认false
            nullable: true, //默认true
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