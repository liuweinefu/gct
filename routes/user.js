var createRouter = require('./baseRouter');



var config = {
    routerName: __filename,
    multiData: true,
    //singleData: true,
    mainIndex: 'multi', //multi or single
    importAble: true,
    exportAble: true,
    exportExcelFields: ['name', 'user_role_id', 'user_role_name', 'phone', 'other_contacts', 'last_login_time', 'remark', 'base_wage', 'deduction_wage', 'privileges', 'menus', 'tabs'], //array
    initArray: [{ db: 'user_role', fields: ['id', 'name'] }], // [{ db: 'user_role', fields: ['id', 'name'] }];
    dbTable: 'user',
    viewTable: 'view_user', //db or view
    //readonly 为 true，才会检测nullable 为false ,才会调用checkEmpty
    fieldsMap: new Map()
        .set('id', {
            readonly: true, //默认false
            //nullable: false, //默认ture
            //formatter: 'int', // string,int,float,pass or function(key,value) return[err,value];
        })
        .set('pass', {
            //readonly: false,  //默认false
            nullable: true, //默认ture
            formatter: 'pass',
        })
        .set('name', {
            //readonly: false,  //默认false
            nullable: false, //默认ture
            formatter: 'string',
        })
        .set('user_role_id', {
            //readonly: false,  //默认false
            nullable: false, //默认ture
            formatter: 'int',
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
        .set('last_login_time', {
            readonly: true, //默认false
            //nullable: false, //默认ture
            //formatter: 'string',
        })
        .set('base_wage', {
            readonly: true, //默认false
            //nullable: false, //默认ture
            //formatter: 'float',
        }),

};


var router;
[config, router] = createRouter(config);



router.get('/wage/:id', router.getCon, function(req, res, next) {
    if (req.params.id === undefined) {
        next();
        return;
    }

    req.dbCon.queryAsync('SELECT id,name,base_wage FROM ' + config.viewTable + ' WHERE id= ' + mysqlPool.escape(req.params.id))
        .then(function(rows) {
            req.session.currentUser = Object.assign({}, rows[0]);
            res.render(router.getFileName(config.routerName, true) + 'wage', req.session.currentUser);
        })
        .catch(function(err) {
            next(err);
        })
        .finally(function() {
            req.dbCon.release();
        });

});

router.post('/wage', router.getCon, function(req, res, next) {
    if (req.session.currentUser === undefined || req.session.currentUser.id === undefined) {
        next();
        return;
    };
    // let queries = [];
    // queries.push('SELECT count(*) as count FROM member_consumption WHERE id=' + mysqlPool.escape(req.session.currentUser.id));
    // queries.push();

    req.dbCon.queryAsync('SELECT id,create_time,price,count,is_cash,commodity_id,commodity_name,commodity_price,member_id,member_name,write_user_name,service_user_name,is_close,remark FROM member_consumption WHERE is_close != "1" AND service_user_id=' + mysqlPool.escape(req.session.currentUser.id))
        .then(function(rows) {
            req.session.currentUser.consumptionIDs = rows.map(function(record) { return record.id });
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

router.post('/saveWage', router.getCon, function(req, res, next) {
    if (req.session.currentUser === undefined && !Array.isArray(req.session.currentUser.consumptionIDs)) {
        next();
        return;
    };
    let deleteIDs = JSON.parse(req.body.deleteIDs);
    deleteIDs = Array.isArray(deleteIDs) ? deleteIDs : [];

    let updateIds = req.session.currentUser.consumptionIDs;
    if (updateIds.length > 0 && deleteIDs.length > 0) {
        updateIds = updateIds.filter(function(updateID) {
            return !deleteIDs.includes(updateID);
        });
    };

    let baseWage = Number.parseFloat(req.body.baseWage);
    baseWage = Number.isNaN(baseWage) ? 0 : baseWage;

    let deductionWage = Number.parseFloat(req.body.deductionWage);
    deductionWage = Number.isNaN(deductionWage) ? 0 : deductionWage;

    let userWageRecord = [];
    userWageRecord.push(['user_id', req.session.currentUser.id]);
    userWageRecord.push(['user_name', req.session.currentUser.name]);
    userWageRecord.push(['base_wage', baseWage]);
    userWageRecord.push(['deduction_wage', deductionWage]);


    let queries = [];
    if (updateIds.length > 0) {
        userWageRecord.push(['member_consumption_ids', updateIds.join(',')]);

        queries.push('INSERT INTO user_wage (' + userWageRecord.map(function(item) { return item[0]; }).join(',') + ') VALUES (' + userWageRecord.map(function(item) { return '"' + item[1] + '"'; }).join(',') + ')');
        queries.push('UPDATE member_consumption SET is_close=1 WHERE id in (' + updateIds.join(',') + ')');
    } else {
        queries.push('INSERT INTO user_wage (' + userWageRecord.map(function(item) { return item[0]; }).join(',') + ') VALUES (' + userWageRecord.map(function(item) { return '"' + item[1] + '"'; }).join(',') + ')');
    };

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
                message: '结算已入库',
                //message: '结算完成!</br>员工<b>' + req.session.currentUser.name + '</b></br>底薪:<b>' + baseWage + '</b>元</br>奖金:<b>' + deductionWage + '</b>元</br>合计:<b>' + (baseWage * 100 + deductionWage * 100) / 100 + '</b>元',
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





//router的特例设置


// router.get('/abc', function(req, res, next) {
//     console.log(config.fieldsMap);
//     next();
// });


module.exports = router;