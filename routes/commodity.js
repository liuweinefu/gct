var createRouter = require('./baseRouter');



var config = {
    routerName: __filename,
    multiData: true,
    //singleData: true,
    mainIndex: 'multi', //multi or single
    importAble: true,
    exportAble: true,
    exportExcelFields: ['name', 'price', 'count', 'remark', 'commodity_type_id', 'commodity_type_name'], //array
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

router.get('/recharge/:id', router.getCon, function(req, res, next) {
    if (req.params.id === undefined) {
        next();
        return;
    }

    req.dbCon.queryAsync('SELECT id,name,price,count FROM ' + config.viewTable + ' WHERE id= ' + mysqlPool.escape(req.params.id))
        .then(function(rows) {
            req.session.currentCommodity = Object.assign({}, rows[0]);
            res.render(router.getFileName(config.routerName, true) + 'recharge', req.session.currentCommodity);
        })
        .catch(function(err) {
            next(err);
        })
        .finally(function() {
            req.dbCon.release();
        });

});

router.post('/recharge', router.getCon, function(req, res, next) {
    if (req.session.currentCommodity === undefined || req.session.currentCommodity.id === undefined) {
        next();
        return;
    };
    let commodityCount = Number.parseInt(req.body.count);
    let commodityAllPrice = Number.parseFloat(req.body.allPrice);
    if (Number.isNaN(commodityCount) || Number.isNaN(commodityAllPrice)) {
        res.json({
            err: true,
            message: '数据错误',
        });
        return;
    };
    if (commodityCount === 0) {
        res.json({
            err: true,
            message: '商品数量不能为0',
        });
        return;
    };

    let commodityRechargeRecord = [];
    commodityRechargeRecord.push(['commodity_id', req.session.currentCommodity.id]);
    commodityRechargeRecord.push(['commodity_name', req.session.currentCommodity.name]);
    commodityRechargeRecord.push(['commodity_count', req.session.currentCommodity.count]);
    commodityRechargeRecord.push(['commodity_price', req.session.currentCommodity.price]);
    commodityRechargeRecord.push(['recharge_count', commodityCount]);
    commodityRechargeRecord.push(['recharge_all_price', commodityAllPrice]);
    commodityRechargeRecord.push(['recharge_single_price', commodityAllPrice / commodityCount]);
    commodityRechargeRecord.push(['remark', mysqlPool.escape(req.body.remark)]);

    let queries = [];

    queries.push('INSERT INTO commodity_recharge (' + commodityRechargeRecord.map(function(item) { return item[0]; }).join(',') + ') VALUES (' + commodityRechargeRecord.map(function(item) { return '"' + item[1] + '"'; }).join(',') + ')');
    queries.push('UPDATE ' + config.dbTable + ' SET count=count+' + commodityCount + ' WHERE id=' + mysqlPool.escape(req.session.currentCommodity.id));



    req.dbCon.beginTransactionAsync = Promise.promisify(req.dbCon.beginTransaction);
    req.dbCon.commitAsync = Promise.promisify(req.dbCon.commit);
    req.dbCon.rollbackAsync = Promise.promisify(req.dbCon.rollback);

    req.dbCon.beginTransactionAsync()
        .then(function() {
            return req.dbCon.queryAsync(queries.join(';'));
        })
        .then(function(rows) {
            res.json({
                err: false,
                message: req.session.currentCommodity.name + '已入库',
            });
            req.dbCon.commitAsync();
        })
        .catch(function(err) {
            req.dbCon.rollbackAsync();
            next(err);
        })
        .finally(function() {
            req.dbCon.release();
        });



});




module.exports = router;