var express = require('express');
var router = express.Router();
//var crypto = require('crypto');
var xlsx = require('node-xlsx').default;

/* GET privilege . */

router.get('/', function(req, res, next) {
    res.render('./privilege/index');
});

router.get('/importExcel', function(req, res, next) {
    res.render('./privilege/importExcel');
});

router.get('/exportExcel', function(req, res, next) {
    let currentCon = null;
    mysqlPool.getConnectionAsync()
        .then(function(con) {
            currentCon = con;
            currentCon.queryAsync = Promise.promisify(currentCon.query);
            return currentCon.queryAsync('select * from privilege');
        })
        .then(function(result) {
            currentCon.release();
            let data = [];
            let keys = Object.keys(result[0]);
            //let keys = ['id', 'name', 'url', 'type'];
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
            let wirteBuffer = xlsx.build([{ name: "privilege", data: data }])
            res.setHeader('Content-Type', 'application/vnd.openxmlformats');
            res.setHeader("Content-Disposition", "attachment; filename=" + "privilege.xlsx");
            res.end(wirteBuffer, 'binary');
        });

});


router.post('/', function(req, res, next) {

    let selectQueries = [];
    selectQueries.push('select count(*) as count from privilege');

    let page = Number.isNaN(parseInt(req.body.page)) ? 1 : parseInt(req.body.page);
    let rows = Number.isNaN(parseInt(req.body.rows)) ? 10 : parseInt(req.body.rows);
    let offset = (page - 1) * rows;
    let query = '';

    if (!req.body.name || !req.body.value) {
        query = 'SELECT id,name,url,type FROM privilege limit ' + mysqlPool.escape(offset) + ',' + mysqlPool.escape(rows);
    } else {
        query = 'SELECT id,name,url,type FROM privilege where ' + mysqlPool.escapeId(req.body.name) + ' like "%' + req.body.value.trim() + '%" limit ' + mysqlPool.escape(offset) + ',' + mysqlPool.escape(rows);
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
});

router.post('/save', function(req, res, next) {
    //console.log('req.body');
    req.body = JSON.parse(req.body.value);
    let executePromise = [];
    executePromise[0] = executeQueries(buildInsertQueries(req.body.insert));
    executePromise[1] = executeQueries(buildUpdateQueries(req.body.update));
    executePromise[2] = executeQueries(buildDeleteQueries(req.body.delete));

    Promise.all(executePromise)
        .then(function(values) {
            res.status(200).end();
        });
});


var buildInsertQueries = function(arrayData) {
    let queries = [];
    if (!Array.isArray(arrayData) || arrayData.length === 0) {
        return queries;
    }
    for (item of arrayData) {
        if ((typeof item.name) !== 'string' || item.name.tirm() === '') { continue; }
        let query = ''
        for (let key in item) {
            switch (key) {
                case 'id':
                    break;
                default:
                    item[key] = typeof item[key] === 'string' ? item[key].trim() : item[key];
                    query = query + mysqlPool.escapeId(key) + '=' + mysqlPool.escape(item[key]) + ',';
                    break;
            }
        }

        queries.push('insert into privilege set ' + query.slice(0, -1));
    }
    return queries;
};

var buildUpdateQueries = function(arrayData, keys) {
    let queries = [];
    if (!Array.isArray(arrayData) || arrayData.length === 0) {
        return queries;
    }
    keys = Array.isArray(keys) && keys.length !== 0 ? keys : ['id'];

    for (item of arrayData) {
        if (F.isEmpty(item.name)) { continue; }
        if ((typeof item.name) !== 'string' || item.name.tirm() === '') { continue; }

        let query = ''
        for (let key in item) {
            switch (key) {
                case 'id':
                    break;
                case 'name':
                    if (keys.indexOf('name') !== -1) {
                        break;
                    }
                    // if (keys.indexOf('name') === -1) {
                    //     item[key] = item[key].toString().trim();
                    //     query = query + mysqlPool.escapeId(key) + '=' + mysqlPool.escape(item[key]) + ',';
                    // }
                    // break;
                default:
                    item[key] = typeof item[key] === 'string' ? item[key].trim() : item[key];
                    query = query + mysqlPool.escapeId(key) + '=' + mysqlPool.escape(item[key]) + ',';
                    break;
            }
        }
        let where = keys.reduce(function(previousKey, currentKey, index, array) {
            return previousKey + ' and ' + currentKey + '=' + mysqlPool.escape([item[currentKey]]);
        }, '');
        //console.log('where:' + where);
        // queries.push('update privilege set ' + query.slice(0, -1) + ' where id=' + mysqlPool.escape([privilege.id]));
        queries.push('update privilege set ' + query.slice(0, -1) + ' where ' + where.slice(4));
    }
    return queries;
};

var buildDeleteQueries = function(arrayData, keys) {
    let queries = [];

    if (!Array.isArray(arrayData) || arrayData.length === 0) {
        return queries;
    }
    keys = Array.isArray(keys) && keys.length !== 0 ? keys : ['id'];

    if (keys.indexOf('id') !== -1) {
        let query = '(';
        for (item of arrayData) {
            query = query + mysqlPool.escape([item.id]) + ',';
        }
        query = query.slice(0, -1) + ')';
        queries.push('delete from privilege where id in ' + query);
        return queries;
    } else {
        let query = ''
        for (item of arrayData) {
            let where = keys.reduce(function(previousKey, currentKey, index, array) {
                return previousKey + ' and ' + currentKey + '=' + mysqlPool.escape([item[currentKey]]);
            }, '');
            //console.log('where:' + where);
            // queries.push('update privilege set ' + query.slice(0, -1) + ' where id=' + mysqlPool.escape([privilege.id]));
            queries.push('delete from privilege where ' + where.slice(4));
        }
        return queries;
    }


};

var executeQueries = function(queries, backResults) {
    let results = [];
    if (!Array.isArray(queries) || queries.length === 0) {
        return Promise.resolve(results);
    }
    backResults = typeof backResults === 'boolean' ? backResults : false;

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

var filterImportPostData = function(arrayData) {
    if (!Array.isArray(arrayData) || arrayData.length === 0) {
        return Promise.resolve({});
        // return Promise.resolve({
        //     newData: [],
        //     oldData: []
        // });
    }

    let currentCon = null;
    return mysqlPool.getConnectionAsync()
        .then(function(con) {
            currentCon = con;
            currentCon.queryAsync = Promise.promisify(currentCon.query);
            return currentCon.queryAsync('select name from privilege');
        })
        .then(function(rows) {
            currentCon.release();
            itemNames = rows.map(item => item.name)
            let oldData = [];
            let newData = [];
            for (item of arrayData) {
                if ((typeof item.name) !== 'string' || item.name.tirm() === '') { continue; }
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

    if ((!Array.isArray(req.body.postKeys) || req.body.postKeys.length === 0) && ['update', 'addAndUpdate', 'delete'].indexOf(req.body.postType) !== -1) {
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

    //针对privilege
    //console.log(req.body.postKeys);
    if (Array.isArray(req.body.postKeys) && (req.body.postKeys.length > 1 || req.body.postKeys[0] !== 'name')) {
        res.json({
            err: true,
            message: 'postKeys 错误'
        });
        return;
    }




    //console.log(req.body);
    switch (req.body.postType) {
        case 'add':
            filterImportPostData(req.body.postData)
                .then(function(Data) {
                    if (Data.newData === undefined || Data.newData.length === 0) {
                        return Promise.resolve([]);
                    }
                    return executeQueries(buildInsertQueries(Data.newData), true);
                })
                .then(function(value) {
                    let backNumber = 0;
                    if (Array.isArray(value) && value.length !== 0) {
                        backNumber = value
                            .map(element => element.affectedRows)
                            .reduce(function(previousValue, currentValue, index, array) {
                                return previousValue + currentValue;
                            });
                    } else {
                        backNumber = value.affectedRows !== undefined ? value.affectedRows : 0;
                    }
                    res.json({
                        err: false,
                        message: '成功添加:' + backNumber + '条数据',
                    });
                    //res.status(200).end();
                })
                .catch(function(err) {
                    res.json({
                        err: true,
                        message: '添加失败',

                    })
                });
            break;
        case 'update':
            filterImportPostData(req.body.postData)
                .then(function(Data) {
                    if (F.isEmpty(Data)) {
                        return Promise.resolve([]);
                    }
                    return executeQueries(buildUpdateQueries(Data.oldData, ['name']), true);
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
                    console.log('privilege/inmportExcel/update Err------------------------------------------start');
                    console.log(err);
                    console.log('privilege/inmportExcel/update Err------------------------------------------end');
                    res.json({
                            err: true,
                            message: '更新失败',

                        })
                        //res.status(500).end();
                });
            break;
        case 'addAndUpdate':
            filterImportPostData(req.body.postData)
                .then(function(Data) {
                    if (F.isEmpty(Data)) {
                        return Promise.resolve([]);
                    }
                    let insertAndbuildUpdateQueries = F.isEmpty(Data.newData) ? [] : buildInsertQueries(Data.newData);
                    insertAndbuildUpdateQueries = F.isEmpty(Data.oldData) ? insertAndbuildUpdateQueries.concat([]) : insertAndbuildUpdateQueries.concat(buildUpdateQueries(Data.oldData, ['name']));
                    return executeQueries(insertAndbuildUpdateQueries, true);
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
                    console.log('privilege/inmportExcel/addAndUpdate Err------------------------------------------start');
                    console.log(err);
                    console.log('privilege/inmportExcel/addAndUpdate Err------------------------------------------end');
                    res.json({
                            err: true,
                            message: '添加或更新失败',

                        })
                        //res.status(500).end();
                });
            break;
        case 'delete':
            filterImportPostData(req.body.postData)
                .then(function(Data) {
                    if (F.isEmpty(Data)) {
                        return Promise.resolve([]);
                    }
                    return executeQueries(buildDeleteQueries(Data.oldData, ['name']), true);
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
                    console.log('privilege/inmportExcel/delete Err------------------------------------------start');
                    console.log(err);
                    console.log('privilege/inmportExcel/delete Err------------------------------------------end');
                    res.json({
                            err: true,
                            message: '更新删除',

                        })
                        //res.status(500).end();
                });
            break;

        case 'copy':
            filterImportPostData(req.body.postData)
                .then(function(Data) {
                    if (F.isEmpty(Data)) {
                        return Promise.resolve([]);
                    }
                    let copyData = Data.newData.concat(Data.oldData);
                    return executeQueries(['delete from privilege'].concat(buildInsertQueries(copyData)), true);
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
                    console.log('privilege/inmportExcel/add Err------------------------------------------start');
                    console.log(err);
                    console.log('privilege/inmportExcel/add Err------------------------------------------end');
                    res.json({
                            err: true,
                            message: '添加失败',

                        })
                        //res.status(500).end();
                });
            break;
    }

});


module.exports = router