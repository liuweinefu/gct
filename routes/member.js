var createRouter = require('./baseRouter');
var multiparty = require('multiparty');
var fs = require("fs");

var config = {
    routerName: __filename,
    multiData: true,
    //singleData: true,
    mainIndex: 'multi', //multi or single
    importAble: true,
    exportAble: true,
    exportExcelFields: ['name', 'pass', 'balance', 'phone', 'other_contacts', 'create_time', 'remark', 'member_role_id', 'member_role_name', 'member_case'], //array
    initArray: [{ db: 'member_role', fields: ['id', 'name', 'discount', 'remark'] }], // [{ db: 'user_role', fields: ['id', 'name'] }]
    dbTable: 'member',
    viewTable: 'view_member', //db or view
    orderFields: ['create_time'],
    orderMode: 'DESC',
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
        .set('card_id', {
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
            readonly: true, //默认false
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
        .set('member_case', {
            //readonly: true, //默认false
            //nullable: false, //默认ture
            formatter: 'string',
        }),

};


var router;
[config, router] = createRouter(config);


router.get('/case/:id', router.getCon, function(req, res, next) {
    if (req.params.id === undefined) {
        next();
        return;
    }

    req.dbCon.queryAsync('SELECT id,name,card_id,create_time,phone,other_contacts,remark,member_role_name,member_case,member_case_remark FROM ' + config.viewTable + ' WHERE id= ' + mysqlPool.escape(req.params.id))
        .then(function(rows) {
            req.session.currentMember = Object.assign({}, rows[0]);

            res.render(router.getFileName(config.routerName, true) + 'case', req.session.currentMember);
        })
        .catch(function(err) {
            next(err);
        })
        .finally(function() {
            req.dbCon.release();
        });

});

router.post('/case', router.getCon, function(req, res, next) {
    if (req.session.currentMember === undefined) { next(); return; };
    var form = new multiparty.Form({ uploadDir: './public/tmp/' });

    form.parse(req, function(err, fields, files) {
        if (err) { next(err); };
        let localMessage = [];

        //upPic
        if (Array.isArray(files.upPic) && files.upPic[0].size != 0) {
            fs.renameSync(files.upPic[0].path, './public/memberCase/ID' + req.session.currentMember.id + '_up.jpg');
            localMessage.push('正面上传成功');
        } else {
            fs.unlinkSync(files.upPic[0].path);
            localMessage.push('正面未更新');
        }

        //downPic
        if (Array.isArray(files.downPic) && files.downPic[0].size != 0) {
            fs.renameSync(files.downPic[0].path, './public/memberCase/ID' + req.session.currentMember.id + '_down.jpg');
            localMessage.push('背面上传成功');
        } else {
            fs.unlinkSync(files.downPic[0].path);
            localMessage.push('背面未更新');
        }

        //leftPic
        if (Array.isArray(files.leftPic) && files.leftPic[0].size != 0) {
            fs.renameSync(files.leftPic[0].path, './public/memberCase/ID' + req.session.currentMember.id + '_left.jpg');
            localMessage.push('左侧上传成功');
        } else {
            fs.unlinkSync(files.leftPic[0].path);
            localMessage.push('左侧未更新');
        }

        //rightPic
        if (Array.isArray(files.rightPic) && files.rightPic[0].size != 0) {
            fs.renameSync(files.rightPic[0].path, './public/memberCase/ID' + req.session.currentMember.id + '_right.jpg');
            localMessage.push('右侧上传成功');
        } else {
            fs.unlinkSync(files.rightPic[0].path);
            localMessage.push('右侧未更新');
        };



        function return2Br(str) {
            return str.replace(/\r?\n/g, " ");
        };
        fields.memberCase[0] = return2Br(fields.memberCase[0]);
        fields.memberCaseRemark[0] = return2Br(fields.memberCaseRemark[0]);

        if (req.session.currentMember.member_case == mysqlPool.escape(fields.memberCase[0]) &&
            req.session.currentMember.member_case_remark == mysqlPool.escape(fields.memberCaseRemark[0])) {
            localMessage.push('情况及步骤未更新');
            res.json({
                err: false,
                message: localMessage
            });
            return;
        }
        req.dbCon.queryAsync('UPDATE ' + config.dbTable + ' SET member_case=' + mysqlPool.escape(fields.memberCase[0]) + ',member_case_remark=' + mysqlPool.escape(fields.memberCaseRemark[0]) + ' WHERE id=' + req.session.currentMember.id)
            .then(function(rows) {
                req.session.currentMember.member_case = mysqlPool.escape(fields.memberCase[0]);
                req.session.currentMember.member_case_remark = mysqlPool.escape(fields.memberCaseRemark[0]);
                localMessage.push('情况及步骤更新成功');
                res.json({
                    err: false,
                    message: localMessage
                });
            })
            .catch(function(err) {
                next(err);
            })
            .finally(function() {
                req.dbCon.release();
            });

    });
});


router.get('/listCase', function(req, res, next) {
    if (req.session.currentMember === undefined) { next(); return; };
    var currentMember = req.session.currentMember;
    currentMember.create_time = new Date(Date.parse(req.session.currentMember.create_time)).toLocaleString()
    res.render(router.getFileName(config.routerName, true) + 'listCase', currentMember);

});

router.post('/cleanPass', router.getCon, function(req, res, next) {
    if (req.body.id === undefined) {
        next();
        return;
    };
    req.dbCon.queryAsync('UPDATE ' + config.dbTable + ' SET pass=""')
        .then(function(rows) {
            res.json({
                err: false,
                message: '密码已清空'
            });
        })
        .catch(function(err) {
            next(err);
        })
        .finally(function() {
            req.dbCon.release();
        });
});


module.exports = router;