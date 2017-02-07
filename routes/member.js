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
    exportExcelFields: ['name', 'pass', 'balance', 'phone', 'other_contacts', 'create_time', 'remark', 'member_role_id', 'member_role_name', 'discount', 'member_case'], //array
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
    }

    req.dbCon.queryAsync('SELECT id,name,phone,other_contacts,remark,member_role_name,member_case FROM view_member WHERE id= ' + mysqlPool.escape(req.params.id))
        .then(function(rows) {
            req.session.currentMember = Object.assign({}, rows[0]);
            req.session.currentMember.upPic = '';
            req.session.currentMember.downPic = '';
            req.session.currentMember.leftPic = '';
            req.session.currentMember.rightPic = '';
            res.render(router.getFileName(config.routerName, true) + 'list', req.session.currentMember);
        })
        .catch(function(err) {
            next(err);
        })
        .finally(function() {
            req.dbCon.release();
        });

});

router.post('/case', function(req, res, next) {
    if (req.session.currentMember === undefined) { next(err); };
    var form = new multiparty.Form({ uploadDir: './public/tmp/' });

    form.parse(req, function(err, fields, files) {
        if (err) { next(err); };
        console.log(files.files[0].originalFileName);

        // fs.rename(files.upload[0].path, './public/memberCase/leftPic.jpg', function(err) {
        //     if (err) { next(err); };
        //     res.json({
        //         err: false,
        //         message: '上传成功'

        //     });
        // });

        // console.log(fields);
        // console.log(files.originalFilename);
        // console.log(files.path);
    });






});

//router的特例设置


// router.get('/abc', function(req, res, next) {
//     console.log(config.fieldsMap);
//     next();
// });


module.exports = router;