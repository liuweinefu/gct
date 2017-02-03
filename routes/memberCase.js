var createRouter = require('./baseRouter');



var config = {
    routerName: __filename,
    multiData: true,
    //singleData: true,
    //exportAble: true, //boolean 
    //exportExcelFields: ['id', 'create_time', 'price', 'is_cash', 'commodity_id', 'commodity_name', 'commodity_count', 'member_id', 'member_name', 'write_user_id', 'write_user_name', 'service_user_id', 'service_user_name', 'is_close', 'remark'], //array
    mainIndex: 'multi', //multi or single
    dbTable: 'member_consumption', //db or view
    //readonly 为 true，才会检测nullable 为false ,才会调用checkEmpty
    fieldsMap: new Map()
        .set('id', {
            readonly: true, //默认false
        })
        .set('member_id', {
            readonly: false, //默认false
            nullable: false, //默认true
            formatter: 'string',
        })
        .set('member_name', {
            readonly: false, //默认false
            nullable: false, //默认true
            formatter: 'string',
        })
        .set('front_pic', {
            readonly: false, //默认false
            nullable: false, //默认true
            formatter: 'string',
        })
        .set('back_pic', {
            readonly: false, //默认false
            nullable: false, //默认true
            formatter: 'string',
        })
        .set('left_pic', {
            readonly: false, //默认false
            nullable: false, //默认true
            formatter: 'string',
        })
        .set('right_pic', {
            readonly: false, //默认false
            nullable: false, //默认true
            formatter: 'string',
        })
        .set('create_time', {
            readonly: true, //默认false
        })
        .set('last_update_time', {
            readonly: false, //默认false
            nullable: false, //默认true
            formatter: 'time',
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