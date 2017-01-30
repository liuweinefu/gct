var createRouter = require('./baseRouter');



var config = {
    routerName: __filename,
    multiData: true,
    //singleData: true,
    mainIndex: 'multi', //multi or single
    importAble: true,
    exportAble: true,
    exportExcelFields: ['name', 'pass', 'balance', 'phone', 'other_contacts', 'create_time', 'remark', 'member_role_id', 'member_role_name', 'discount'], //array
    initArray: [{ db: 'member_role', fields: ['id', 'name'] }], // [{ db: 'user_role', fields: ['id', 'name'] }]
    dbTable: 'member',
    viewTable: 'view_member', //db or view

    //readonly 为 true，才会检测nullable 为false ,才会调用checkEmpty
    fieldsMap: new Map()
        .set('id', {
            readonly: true, //默认false
            //nullable: false, //默认ture
            //formatter: 'int', // string,int,float,pass or function(key,value) return[err,value];
        })
        .set('name', {
            //readonly: false,  //默认false
            nullable: false, //默认ture
            formatter: 'string',
        })
        .set('pass', {
            //readonly: false,  //默认false
            nullable: true, //默认ture
            formatter: 'pass',
        })
        .set('balance', {
            //readonly: false,  //默认false
            nullable: false, //默认ture
            formatter: 'float',
        })
        .set('phone', {
            //readonly: false,  //默认false
            nullable: true, //默认ture
            formatter: 'string',
        })
        .set('other_contacts', {
            //readonly: false,  //默认false
            nullable: true, //默认ture
            formatter: 'string',
        })
        .set('remark', {
            //readonly: false,  //默认false
            nullable: true, //默认ture
            formatter: 'string',
        })
        .set('create_time', {
            readonly: true, //默认false
            //nullable: false, //默认ture
            //formatter: 'string',
        })
        .set('member_role_id', {
            //readonly: false,  //默认false
            nullable: false, //默认ture
            formatter: 'int',
        })

        .set('discount', {
        readonly: true, //默认false
        //nullable: false, //默认ture
        //formatter: 'string',
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