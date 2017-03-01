var createRouter = require('./baseRouter');



var config = {
    routerName: __filename,
    multiData: true,
    //singleData: true,
    exportAble: true, //boolean 
    exportExcelFields: ['id', 'create_time', 'price', 'count', 'is_discount', 'is_cash', 'commodity_id', 'commodity_name', 'commodity_price', 'member_id', 'member_name', 'write_user_id', 'write_user_name', 'service_user_id', 'service_user_name', 'is_close', 'remark'], //array
    mainIndex: 'multi', //multi or single
    dbTable: 'member_consumption', //db or view
    //readonly 为 true，才会检测nullable 为false ,才会调用checkEmpty
    fieldsMap: new Map()
        .set('id', {
            readonly: true, //默认false
        })
        .set('create_time', {
            readonly: true, //默认false
        })
        .set('price', {
            readonly: true, //默认false            
        })
        .set('count', {
            readonly: true, //默认false            
        })
        .set('is_cash', {
            readonly: true, //默认false
        })
        .set('is_discount', {
            readonly: true, //默认false
        })
        .set('commodity_id', {
            readonly: true, //默认false
        })
        .set('commodity_name', {
            readonly: true, //默认false
        })
        .set('commodity_price', {
            readonly: true, //默认false
        })
        .set('member_id', {
            readonly: true, //默认false
        })
        .set('member_name', {
            readonly: true, //默认false
        })
        .set('write_user_id', {
            readonly: true, //默认false
        })
        .set('write_user_name', {
            readonly: true, //默认false
        })
        .set('service_user_id', {
            readonly: true, //默认false
        })
        .set('service_user_name', {
            readonly: true, //默认false
        })
        .set('is_close', {
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