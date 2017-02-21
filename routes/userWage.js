var createRouter = require('./baseRouter');



var config = {
    routerName: __filename,
    multiData: true,
    //singleData: true,
    exportAble: true, //boolean 
    exportExcelFields: ['id', 'user_id', 'user_name', 'create_time', 'base_wage', 'deduction_wage', 'member_consumption_ids', 'remark'], //array
    mainIndex: 'multi', //multi or single
    dbTable: 'user_wage', //db or view
    //readonly 为 true，才会检测nullable 为false ,才会调用checkEmpty
    fieldsMap: new Map()
        .set('id', {
            readonly: true, //默认false
        })
        .set('user_id', {
            readonly: true, //默认false
        })
        .set('user_name', {
            readonly: true, //默认false
        })
        .set('create_time', {
            readonly: true, //默认false
        })
        .set('base_wage', {
            readonly: true, //默认false
        })
        .set('deduction_wage', {
            readonly: true, //默认false
        })
        .set('member_consumption_ids', {
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


router.post('/listConsumption/:ids', router.getCon, function(req, res, next) {
    if (req.params.ids === undefined || req.params.ids.trim() === '') {
        res.json({
            total: 0,
            rows: []
        });
        next();
        return;
    }


    req.dbCon.queryAsync('SELECT id,create_time,price,count,is_cash,commodity_id,commodity_name,commodity_price,member_id,member_name,write_user_name,service_user_name,is_close,remark FROM member_consumption WHERE id in (' + mysqlPool.escape(req.params.ids).slice(1, -1) + ')')
        .then(function(rows) {
            res.json({
                total: rows.length,
                rows: rows
            });
        })
        .catch(function(err) {
            next(err);
        })
        .finally(function() {
            req.dbCon.release();
        });



});

//router的特例设置


// router.get('/abc', function(req, res, next) {
//     console.log(config.fieldsMap);
//     next();
// });


module.exports = router;