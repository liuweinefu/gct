var createRouter = require('./baseRouter');



var config = {
    routerName: __filename,
    multiData: true,
    //singleData: true,
    exportAble: true, //boolean 
    exportExcelFields: ['id', 'create_time', 'price', 'count', 'is_discount', 'is_cash', 'commodity_id', 'commodity_name', 'commodity_price', 'member_id', 'member_name', 'write_user_id', 'write_user_name', 'service_user_id', 'service_user_name', 'is_close', 'remark'], //array
    mainIndex: 'multi', //multi or single
    dbTable: 'member_consumption', //db or view
    orderFields: ['create_time'],
    orderMode: 'DESC',
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


router.post('/multiCount', router.getCon, function(req, res, next) {

    if (!req.body.beginDate || !req.body.endDate) {
        req.dbCon.release();
        res.json({
            total: 0,
            rows: [],
            footer: [],
        });
        return;
    };


    // let page = Number.isNaN(parseInt(req.body.page)) ? 1 : parseInt(req.body.page);
    // let rows = Number.isNaN(parseInt(req.body.rows)) ? 10 : parseInt(req.body.rows);
    // let offset = (page - 1) * rows;

    let dbFields = [];
    for (let key of config.fieldsMap.keys()) {
        if (config.fieldsMap.get(key).formatter === 'pass') { continue; }
        dbFields.push(key);
    }


    let selectQueries = [];

    selectQueries.push('SELECT count(*) as count FROM ' + config.viewTable + ' where create_time>=' + mysqlPool.escape(req.body.beginDate) + ' AND create_time<=' + mysqlPool.escape(req.body.endDate));
    selectQueries.push('SELECT ' + dbFields.join(',') + ' FROM ' + config.viewTable + ' where  create_time>=' + mysqlPool.escape(req.body.beginDate) + ' AND create_time<=' + mysqlPool.escape(req.body.endDate) + ' ORDER BY ' + config.orderFields.join(',') + ' ' +
        config.orderMode);

    req.dbCon.queryAsync(selectQueries.join(';'))
        .then(function(rows) {

            var allPrices = 0;
            var allCount = 0;
            rows[1].forEach(function(item) {
                allCount += item.count;
                allPrices += item.price;
            });

            var footer = [{
                commodity_name: '合计',
                price: allPrices,
                count: allCount
            }];

            res.json({
                total: rows[0][0].count,
                rows: rows[1],
                footer: footer,
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