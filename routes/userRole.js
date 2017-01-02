var express = require('express');
var router = express.Router();
//var crypto = require('crypto');
//var md5 = require('md5');
var xlsx = require('node-xlsx').default;

/* GET roles . */

router.get('/', function(req, res, next) {
    res.render('userRole/index');
});

router.get('/importExcel', function(req, res, next) {
    res.render('userRole/importExcel');
});

router.post('/importExcel', function(req, res, next) {
    req.body = JSON.parse(req.body.value);
    //数据格式检查
    if (['add', 'update', 'addAndUpdate', 'delete', 'copy'].indexOf(req.body.postType) === -1) {
        res.json({
            err: true,
            message: 'postType 不符合标准'
        });
        return;
    };
    if (F.isEmpty(req.body.postKeys) && ['update', 'addAndUpdate', 'delete'].indexOf(req.body.postType) !== -1) {
        res.json({
            err: true,
            message: 'postType 与 postKeys 不符'
        });
        return;
    };
    let postFields = Object.keys(req.body.postData[0]);
    let keyErr = false;
    for (key of req.body.postKeys) {
        if (postFields.indexOf(key) === -1) {
            keyErr = true;
            break;
        }
    }
    if (keyErr) {
        res.json({
            err: true,
            message: 'postData 与 postKeys 不符'
        });
        return;
    }

    //针对role
    //console.log(req.body.postKeys);
    if (req.body.postKeys.length > 1 || req.body.postKeys[0] !== 'name') {
        res.json({
            err: true,
            message: 'postKeys 错误'
        });
        return;
    }



    //console.log(req.body);
    switch (req.body.postType) {
        case 'add':
            filtrateImportPostData(req.body.postData)
                .then(function(Data) {
                    if (F.isEmpty(Data)) {
                        return Promise.resolve([]);
                    }
                    return executeQueries(insertQueries(Data.newData), true);
                })
                .then(function(value) {
                    let backNumber = 0;
                    if (F.isNotEmpty(value) && Array.isArray(value)) {
                        backNumber = value
                            .map(element => element.affectedRows)
                            .reduce(function(previousValue, currentValue, index, array) {
                                return previousValue + currentValue;
                            });
                    } else {
                        backNumber = F.isSet(value.affectedRows) ? value.affectedRows : 0;
                    }
                    res.json({
                        err: false,
                        message: '成功添加:' + backNumber + '条数据',
                    });
                    //res.status(200).end();
                })
                .catch(function(err) {
                    console.log('role/inmportExcel/add Err------------------------------------------start');
                    console.log(err);
                    console.log('role/inmportExcel/add Err------------------------------------------end');
                    res.json({
                            err: true,
                            message: '添加失败',

                        })
                        //res.status(500).end();
                });
            break;
        case 'update':
            filtrateImportPostData(req.body.postData)
                .then(function(Data) {
                    if (F.isEmpty(Data)) {
                        return Promise.resolve([]);
                    }
                    return executeQueries(updateQueries(Data.oldData, ['name']), true);
                })
                .then(function(value) {
                    let backNumber = 0;
                    if (F.isNotEmpty(value) && Array.isArray(value)) {
                        backNumber = value
                            .map(element => element.affectedRows)
                            .reduce(function(previousValue, currentValue, index, array) {
                                return previousValue + currentValue;
                            });
                    } else {
                        backNumber = F.isSet(value.affectedRows) ? value.affectedRows : 0;
                    }
                    res.json({
                        err: false,
                        message: '成功更新:' + backNumber + '条数据',
                    });
                    //res.status(200).end();
                })
                .catch(function(err) {
                    console.log('role/inmportExcel/update Err------------------------------------------start');
                    console.log(err);
                    console.log('role/inmportExcel/update Err------------------------------------------end');
                    res.json({
                            err: true,
                            message: '更新失败',

                        })
                        //res.status(500).end();
                });
            break;
        case 'addAndUpdate':
            filtrateImportPostData(req.body.postData)
                .then(function(Data) {
                    if (F.isEmpty(Data)) {
                        return Promise.resolve([]);
                    }
                    let insertAndUpdateQueries = F.isEmpty(Data.newData) ? [] : insertQueries(Data.newData);
                    insertAndUpdateQueries = F.isEmpty(Data.oldData) ? insertAndUpdateQueries.concat([]) : insertAndUpdateQueries.concat(updateQueries(Data.oldData, ['name']));
                    return executeQueries(insertAndUpdateQueries, true);
                })
                .then(function(value) {
                    let backNumber = 0;
                    if (F.isNotEmpty(value) && Array.isArray(value)) {
                        backNumber = value
                            .map(element => element.affectedRows)
                            .reduce(function(previousValue, currentValue, index, array) {
                                return previousValue + currentValue;
                            });
                    } else {
                        backNumber = F.isSet(value.affectedRows) ? value.affectedRows : 0;
                    }
                    res.json({
                        err: false,
                        message: '成功添加及更新:' + backNumber + '条数据',
                    });
                    //res.status(200).end();
                })
                .catch(function(err) {
                    console.log('role/inmportExcel/addAndUpdate Err------------------------------------------start');
                    console.log(err);
                    console.log('role/inmportExcel/addAndUpdate Err------------------------------------------end');
                    res.json({
                            err: true,
                            message: '添加或更新失败',

                        })
                        //res.status(500).end();
                });
            break;
        case 'delete':
            filtrateImportPostData(req.body.postData)
                .then(function(Data) {
                    if (F.isEmpty(Data)) {
                        return Promise.resolve([]);
                    }
                    return executeQueries(deleteQueries(Data.oldData, ['name']), true);
                })
                .then(function(value) {
                    let backNumber = 0;
                    if (F.isNotEmpty(value) && Array.isArray(value)) {
                        backNumber = value
                            .map(element => element.affectedRows)
                            .reduce(function(previousValue, currentValue, index, array) {
                                return previousValue + currentValue;
                            });
                    } else {
                        backNumber = F.isSet(value.affectedRows) ? value.affectedRows : 0;
                    }
                    res.json({
                        err: false,
                        message: '成功删除:' + backNumber + '条数据',
                    });
                    //res.status(200).end();
                })
                .catch(function(err) {
                    console.log('role/inmportExcel/delete Err------------------------------------------start');
                    console.log(err);
                    console.log('role/inmportExcel/delete Err------------------------------------------end');
                    res.json({
                            err: true,
                            message: '更新删除',

                        })
                        //res.status(500).end();
                });
            break;

        case 'copy':
            filtrateImportPostData(req.body.postData)
                .then(function(Data) {
                    if (F.isEmpty(Data)) {
                        return Promise.resolve([]);
                    }
                    let copyData = Data.newData.concat(Data.oldData);
                    return executeQueries(['delete from role'].concat(insertQueries(copyData)), true);
                })
                .then(function(value) {
                    let backNumber = 0;
                    if (F.isNotEmpty(value) && Array.isArray(value)) {
                        value.shift(); //删除记录清除
                        backNumber = value
                            .map(element => element.affectedRows)
                            .reduce(function(previousValue, currentValue, index, array) {
                                return previousValue + currentValue;
                            });
                    } else {
                        backNumber = F.isSet(value.affectedRows) ? value.affectedRows : 0;
                    }
                    res.json({
                        err: false,
                        message: '成功添加:' + backNumber + '条数据',
                    });
                    //res.status(200).end();
                })
                .catch(function(err) {
                    console.log('role/inmportExcel/add Err------------------------------------------start');
                    console.log(err);
                    console.log('role/inmportExcel/add Err------------------------------------------end');
                    res.json({
                            err: true,
                            message: '添加失败',

                        })
                        //res.status(500).end();
                });
            break;
    }

});


router.post('/', function(req, res, next) {

    let selectQueries = [];
    selectQueries.push('select count(*) as count from role');


    let page = F.isNotSet(req.body.page) || Number.isNaN(parseInt(req.body.page)) ? 1 : parseInt(req.body.page);
    let rows = F.isNotSet(req.body.rows) || Number.isNaN(parseInt(req.body.rows)) ? 10 : parseInt(req.body.rows);
    let offset = (page - 1) * rows;
    let query = '';
    if (F.isEmpty(req.body.name) || F.isEmpty(req.body.value)) {
        query = 'SELECT id,name,menus,tabs,privileges FROM role limit ' + mysqlPool.escape(offset) + ',' + mysqlPool.escape(rows);
    } else {
        query = 'SELECT id,name,menus,tabs,privileges FROM role where ' + mysqlPool.escapeId(req.body.name) + ' like "%' + req.body.value.trim() + '%" limit ' + mysqlPool.escape(offset) + ',' + mysqlPool.escape(rows);
    };
    selectQueries.push(query);

    //let executePromise = executeQueries(selectQueries, 'selectQueries', true);
    //Promise.all(executePromise)
    executeQueries(selectQueries, true)
        .then(function(rows) {
            //console.log(rows);
            res.json({
                total: rows[0][0].count,
                rows: rows[1]
            })
        })
        .catch(function(err) {
            console.log('role/ Err------------------------------------------start');
            console.log(err);
            console.log('role/ Err------------------------------------------end');
            res.status(500).end();
        });
});

router.post('/save', function(req, res, next) {
    //console.log('req.body');
    req.body = JSON.parse(req.body.value);
    let executePromise = [];
    executePromise[0] = executeQueries(insertQueries(req.body.insert));
    executePromise[1] = executeQueries(updateQueries(req.body.update));
    executePromise[2] = executeQueries(deleteQueries(req.body.delete));

    Promise.all(executePromise)
        .then(function(values) {
            res.status(200).end();
        })
        .catch(function(err) {
            console.log('role/save Err------------------------------------------start');
            console.log(err);
            console.log('role/save Err------------------------------------------end');
            res.status(500).end();
        });

});


router.get('/exportExcel', function(req, res, next) {
    let currentCon = null;
    mysqlPool.getConnectionAsync()
        .then(function(con) {
            currentCon = con;
            currentCon.queryAsync = Promise.promisify(currentCon.query);
            return currentCon.queryAsync('select * from role');
        })
        .then(function(result) {
            currentCon.release();
            let data = [];
            let keys = Object.keys(result[0]);
            //let keys = ['id', 'name', 'menus', 'tabs', 'privileges'];
            data.push(keys);
            result.forEach(function(row) {
                let rowValue = [];
                keys.forEach(function(key) {
                    rowValue.push(row[key]);
                });
                data.push(rowValue);
            });

            return data;
        })
        .then(function(data) {
            let wirteBuffer = xlsx.build([{ name: "jobwork_role", data: data }])
            res.setHeader('Content-Type', 'application/vnd.openxmlformats');
            res.setHeader("Content-Disposition", "attachment; filename=" + "role.xlsx");
            res.end(wirteBuffer, 'binary');
        });

});


var filtrateImportPostData = function(arrayData) {
    let currentCon = null;
    if (F.isEmpty(arrayData)) { return Promise.resolve([]); }
    return mysqlPool.getConnectionAsync()
        .then(function(con) {
            currentCon = con;
            currentCon.queryAsync = Promise.promisify(currentCon.query);
            return currentCon.queryAsync('select name from role');
        })
        .then(function(rows) {
            currentCon.release();
            itemNames = rows.map(item => item.name)
            let oldData = [];
            let newData = [];
            for (item of arrayData) {
                if (F.isEmpty(item.name)) { continue; }
                if (itemNames.indexOf(item.name) === -1) {
                    newData.push(item);
                } else {
                    oldData.push(item);
                }
            }
            let returnObject = {
                newData: newData,
                oldData: oldData
            };
            return Promise.resolve(returnObject);
        })
};



var insertQueries = function(arrayData) {
    let queries = [];
    if (F.isEmpty(arrayData)) {
        return queries;
    }
    for (item of arrayData) {
        if (F.isEmpty(item.name)) { continue; }
        let query = ''
        for (let key in item) {
            switch (key) {
                case 'id':
                    break;
                default:
                    item[key] = F.isEmpty(item[key]) ? '' : item[key].toString().trim();
                    query = query + mysqlPool.escapeId(key) + '=' + mysqlPool.escape(item[key]) + ',';
                    break
            }
        }
        queries.push('insert into role set ' + query.slice(0, -1));
    }
    return queries;
};

var updateQueries = function(arrayData, keys) {
    let queries = [];
    if (F.isEmpty(arrayData)) {
        return queries;
    }
    keys = F.isEmpty(keys) ? ['id'] : keys;

    for (item of arrayData) {
        if (F.isEmpty(item.name)) { continue; }
        let query = ''
        for (let key in item) {
            switch (key) {
                case 'id':
                    break;
                case 'name':
                    if (keys.indexOf('name') === -1) {
                        item[key] = item[key].toString().trim();
                        query = query + mysqlPool.escapeId(key) + '=' + mysqlPool.escape(item[key]) + ',';
                    }
                    break;
                default:
                    item[key] = F.isEmpty(item[key]) ? '' : item[key].toString().trim();
                    query = query + mysqlPool.escapeId(key) + '=' + mysqlPool.escape(item[key]) + ',';
                    break;
            }
        }
        let where = keys.reduce(function(previousKey, currentKey, index, array) {
            return previousKey + ' and ' + currentKey + '=' + mysqlPool.escape([item[currentKey]]);
        }, '');

        queries.push('update role set ' + query.slice(0, -1) + ' where ' + where.slice(4));
    }
    return queries;
};

var deleteQueries = function(arrayData, keys) {
    let queries = [];

    if (F.isEmpty(arrayData)) {
        return queries;
    }
    keys = F.isEmpty(keys) ? ['id'] : keys;

    if (keys.indexOf('id') !== -1) {
        let query = '(';
        for (item of arrayData) {
            query = query + mysqlPool.escape([item.id]) + ',';
        }
        query = query.slice(0, -1) + ')';
        queries.push('delete from role where id in ' + query);
        return queries;
    } else {
        let query = ''
        for (item of arrayData) {
            let where = keys.reduce(function(previousKey, currentKey, index, array) {
                return previousKey + ' and ' + currentKey + '=' + mysqlPool.escape([item[currentKey]]);
            }, '');
            queries.push('delete from role where ' + where.slice(4));
        }
        return queries;
    }
};

var executeQueries = function(queries, backResults) {
    if (F.isEmpty(backResults)) { backResults = false; }

    let results = [];
    if (F.isEmpty(queries)) {
        return Promise.resolve([]);
    }

    //mysqlPool.getConnectionAsync = Promise.promisify(mysqlPool.getConnection);

    let currentCon = null;
    return mysqlPool.getConnectionAsync()
        .then(function(con) {
            currentCon = con;
            currentCon.queryAsync = Promise.promisify(currentCon.query);
            return currentCon.queryAsync(queries.join(';'));
        })
        .then(function(rows) {
            currentCon.release();
            if (backResults === true) {
                return Promise.resolve(rows);
            } else {
                return Promise.resolve('complete!');
            }
        })
        .catch(function(err) {
            return Promise.reject(err);
        });
}


module.exports = router