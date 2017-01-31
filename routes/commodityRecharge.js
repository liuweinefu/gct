var createRouter = require('./baseRouter');



var config = {
    routerName: __filename,
    multiData: true,
    //singleData: true,
    mainIndex: 'multi', //multi or single
    initArray: [{ db: 'commodity_type', fields: ['id', 'name'] }], // [{ db: 'user_role', fields: ['id', 'name'] }]
    viewTable: 'view_commodity',
    dbTable: 'commodity', //db or view
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
        })
        .set('price', {
            //readonly: false,  //默认false
            nullable: false, //默认ture
            formatter: 'float',
        })
        .set('count', {
            //readonly: false,  //默认false
            nullable: false, //默认ture
            formatter: 'int',
        })
        .set('remark', {
            //readonly: false,  //默认false
            nullable: true, //默认ture
            formatter: 'string',
        })
        .set('commodity_type_id', {
            //readonly: false,  //默认false
            nullable: false, //默认ture
            formatter: 'int',
        })
        .set('commodity_type_name', {
            readonly: true, //默认false
            //nullable: false, //默认ture
            //formatter: 'int',
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