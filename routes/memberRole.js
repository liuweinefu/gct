var createRouter = require('./baseRouter');


var config = {
    routerName: __filename,
    multiData: true,
    //singleData: true,
    mainIndex: 'multi', //multi or single
    importAble: true,
    exportAble: true,
    exportExcelFields: ['name'], //array
    //initArray: [{ db: 'user_role', fields: ['id', 'name'] }], // [{ db: 'user_role', fields: ['id', 'name'] }];
    dbTable: 'member_role', //db or view
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
        .set('discount', {
            //readonly: false,  //默认false
            nullable: false, //默认ture
            formatter: function(key, value) {
                if (typeof value !== 'number') { value = Number.parseFloat(value) };
                let err = false;
                if (Number.isNaN(value) || value < 0 || value > 1) {
                    err = true;
                    value = 0;
                };
                return [err, value];
            },
        })
        .set('remark', {
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