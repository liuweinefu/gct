var createRouter = require('./baseRouter');



var config = {
    routerName: __filename,
    multiData: true,
    //singleData: true,
    exportAble: true, //boolean 
    exportExcelFields: ['id', 'member_id', 'member_name', 'create_time', 'recharge_price', 'write_user_id', 'write_user_name', 'remark'], //array
    mainIndex: 'multi', //multi or single
    dbTable: 'member_recharge', //db or view
    //readonly 为 true，才会检测nullable 为false ,才会调用checkEmpty
    fieldsMap: new Map()
        .set('id', {
            readonly: true, //默认false
        })
        .set('member_id', {
            readonly: true, //默认false
        })
        .set('member_name', {
            readonly: true, //默认false
        })
        .set('create_time', {
            readonly: true, //默认false
        })
        .set('recharge_price', {
            readonly: true, //默认false
        })
        .set('write_user_id', {
            readonly: true, //默认false
        })
        .set('write_user_name', {
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