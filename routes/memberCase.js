var createRouter = require('./baseRouter');



var config = {
    routerName: __filename,
    multiData: true,
    //singleData: true,
    //exportAble: true, //boolean 
    //exportExcelFields: ['id', 'create_time', 'price', 'is_cash', 'commodity_id', 'commodity_name', 'commodity_count', 'member_id', 'member_name', 'write_user_id', 'write_user_name', 'service_user_id', 'service_user_name', 'is_close', 'remark'], //array
    mainIndex: 'multi', //multi or single
    dbTable: 'member_case', //db or view
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

router.get('/list/:id', router.getCon, function(req, res, next) {
    if (req.params.id === undefined) {
        next();
    }

    req.dbCon.queryAsync('SELECT id,name,phone,other_contacts,remark,member_role_name FROM view_member WHERE id= ' + mysqlPool.escape(req.params.id))
        .then(function(rows) {
            req.session.currentMember = Object.assign({}, rows[0]);
            res.render(router.getFileName(config.routerName, true) + 'list', req.session.currentMember);
        })
        .catch(function(err) {
            next(err);
        })
        .finally(function() {
            req.dbCon.release();
        });

});
router.post('/list/', router.getCon, function(req, res, next) {
    if (req.session.currentMember === undefined) {
        next();
    }


    let page = Number.isNaN(parseInt(req.body.page)) ? 1 : parseInt(req.body.page);
    let rows = Number.isNaN(parseInt(req.body.rows)) ? 10 : parseInt(req.body.rows);
    let offset = (page - 1) * rows;

    let dbFields = [];
    for (let key of config.fieldsMap.keys()) {
        if (config.fieldsMap.get(key).formatter === 'pass') { continue; }
        dbFields.push(key);
    }

    let selectQueries = [];
    selectQueries.push('SELECT count(*) as count FROM ' + config.viewTable + ' where member_id = ' + mysqlPool.escape(req.session.currentMember.id));
    selectQueries.push('SELECT ' + dbFields.join(',') + ' FROM ' + config.viewTable + ' where member_id = ' + mysqlPool.escape(req.session.currentMember.id) + ' limit ' + mysqlPool.escape(offset) + ',' + mysqlPool.escape(rows));


    req.dbCon.queryAsync(selectQueries.join(';'))
        .then(function(rows) {
            res.json({
                total: rows[0][0].count,
                rows: rows[1]
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