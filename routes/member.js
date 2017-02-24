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

    req.dbCon.queryAsync('SELECT id,name,phone,other_contacts,remark,member_role_name,member_case FROM ' + config.viewTable + ' WHERE id= ' + mysqlPool.escape(req.params.id))
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
    if (req.session.currentMember === undefined) { next(err); return; };
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
        }




        if (Array.isArray(fields.memberCase) && fields.memberCase.length !== 0 && fields.memberCase[0] !== req.session.currentMember.member_case) {
            //回车转为br标签
            function return2Br(str) {
                return str.replace(/\r?\n/g, " ");
            }
            // //普通字符转换成转意符
            // function html2Escape(sHtml) {
            //     return sHtml.replace(/[<>&"]/g, function(c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; });
            // }

            fields.memberCase[0] = return2Br(fields.memberCase[0]);

            req.dbCon.queryAsync('UPDATE ' + config.dbTable + ' SET member_case=' + mysqlPool.escape(fields.memberCase[0]) + ' WHERE id=' + req.session.currentMember.id)
                .then(function(rows) {
                    if (rows.changedRows === 1) {
                        localMessage.push('健康记录更新成功');
                        res.json({
                            err: false,
                            message: localMessage
                        });
                    } else {
                        localMessage.push('健康记录更新失败');
                        res.json({
                            err: false,
                            message: localMessage
                        });
                    }
                })
                .catch(function(err) {
                    next(err);
                })
                .finally(function() {
                    req.dbCon.release();
                });


        } else {
            localMessage.push('健康记录未更新');
            res.json({
                err: false,
                message: localMessage
            });
        }
    });
});

//router的特例设置


// router.get('/abc', function(req, res, next) {
//     console.log(config.fieldsMap);
//     next();
// });


module.exports = router;