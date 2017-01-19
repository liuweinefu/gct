var express = require('express');
var router = express.Router();
var md5 = require('md5');
var xlsx = require('node-xlsx').default;
//var Promise = require('bluebird');


var config = {};
config.routerName = ''; //__filename
config.exportAble = true; //boolean
config.exportExcelFields = []; //array
config.importAble = true; //boolean
config.dbTable = ''; //db or view
config.fieldsMap = new Map(); //Map()

// config.fieldsMap.set('pass', {
//     updateAble: true,
//     formatter: 'string', // string,int,float,pass or function(value);
//     defaultValue: '654321',
// });




var __formatString = function(value) {
    if (typeof value !== 'string') { value = value.toString().trim() };
    return value;
};
var __formatInt = function(value) {
    if (!Number.isInteger(value)) { value = Number.parseInt(value) };
    if (Number.isNaN(value)) {
        throw new Error("数据类型错误:" + value);
    } else {
        return value;
    }

};
var __formatFloat = function(value) {
    if (typeof value !== 'number') { value = Number.parseFloat(value) };
    if (Number.isNaN(value)) {
        throw new Error("数据类型错误:" + value);
    } else {
        return value;
    }
};
var __formatPass = function(value) {
    if (typeof value !== 'string') { value = value.toString().trim() };
    if (value.length < 6) { return '' };
    return md5(value);
};
var __formatRecord = function(record) {
    for (let key in record) {
        if (!config.fieldsMap.has(key)) { continue; }
        if (typeof config.fieldsMap.get(key).formatter !== 'string' ||
            typeof config.fieldsMap.get(key).formatter !== 'function') { continue; }
        switch (config.fieldsMap.get(key).formatter) {
            case 'string':
                record[key] = __formatString(record[key]);
                break;
            case 'int':
                record[key] = __formatInt(record[key]);
                break;
            case 'float':
                record[key] = __formatFloat(record[key]);
                break;
            case 'pass':
                record[key] = __formatPass(record[key]);
                break;
            default:
                record[key] = typeof config.fieldsMap.get(key).formatter === 'function' ? config.fieldsMap.get(key).formatter(record[key]) : record[key];
        }
    }

}

var getFileName = function(fileName, needPath) {
    needPath = typeof needPath === 'boolean' ? needPath : false;

    let backFileName = '';
    let backPathName = '';

    if (fileName.lastIndexOf('\\') !== -1) {
        backFileName = fileName.substr(fileName.lastIndexOf('\\') + 1, fileName.lastIndexOf('.') - fileName.lastIndexOf('\\') - 1);
        backPathName = '.\\' + backFileName + '\\';
    }
    if (fileName.lastIndexOf('/') !== -1) {
        backFileName = fileName.substr(fileName.lastIndexOf('/') + 1, fileName.lastIndexOf('.') - fileName.lastIndexOf('/') - 1);
        backPathName = './' + backFileName + '/';
    }

    if (backFileName === '') { return backFileName; }
    if (needPath) {
        return backPathName;
    } else {
        return backFileName;
    }
};


var getCon = function(req, res, next) {
    mysqlPool.getConnection(function(err, con) {
        if (err) { next(err) };
        req.dbCon = con;
        req.dbCon.queryAsync = Promise.promisify(req.dbCon.query);
        next();
    });
}


var buildInsertQuery = function(record) {
    if (typeof record !== 'object') { return '' };
    __formatRecord(record);
    let query = '';
    for (let key in record) {
        if (!config.fieldsMap.has(key)) { continue; }
        if (config.fieldsMap.get(key).updateAble === false) { continue; }
        switch (key) {
            case 'id':
                continue;
            case 'pass':
                if (typeof record[key] !== 'string' || record[key].length === 0) {
                    if (!config.fieldsMap.get(key).defaultValue) {
                        return '';
                    }
                    record[key] = md5(config.fieldsMap.get(key).defaultValue);
                    continue;
                }
            case 'name':
                if (typeof record[key] !== 'string' || record[key].length === 0) {
                    return '';
                }
        };
        query = query + mysqlPool.escapeId(key) + '=' + mysqlPool.escape(record[key]) + ',';
    } //for
    query = 'INSERT INTO ' + config.dbTable + ' SET ' + query.slice(0, -1);
    return query;
};
var buildInsertQueries = function(arrayData) {
    let queries = [];
    if (!Array.isArray(arrayData) || arrayData.length === 0) {
        return queries;
    };

    arrayData.forEach(function(record) {
        let query = buildInsertQuery(record);
        if (query !== '') {
            queries.push(query);
        }
    });
    return queries;
};

var buildUpdateQueries = function(arrayData, keys) {
    let queries = [];
    if (!Array.isArray(arrayData) || arrayData.length === 0) {
        return queries;
    }
    keys = Array.isArray(keys) && keys.length !== 0 ? keys : ['id'];


    arrayData.forEach(function(record) {
        __formatRecord(record);
        let query = '';
        for (let key in record) {
            if (!config.fieldsMap.has(key)) { continue; }
            if (config.fieldsMap.get(key).updateAble === false) { continue; }
            switch (key) {
                case 'id':
                    continue;
                case 'name':
                case 'pass':
                    if (typeof record[key] !== 'string' || record[key].length === 0) {
                        continue;
                    }
            }

            query = query + mysqlPool.escapeId(key) + '=' + mysqlPool.escape(record[key]) + ',';

        }

        let where = keys.reduce(function(previousKey, currentKey, index, array) {
            if (config.fieldsMap.has(currentKey)) {
                return previousKey + ' and ' + currentKey + '=' + mysqlPool.escape([record[currentKey]]);
            } else {
                return previousKey;

            }
        }, '');

        queries.push('update ' + config.dbTable + ' set ' + query.slice(0, -1) + ' where ' + where.slice(4));

    });

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
        queries.push('delete from ' + config.dbTable + ' where id in ' + query);
        return queries;
    } else {

        let query = ''

        arrayData.forEach(function(record) {
            __formatRecord(record);

            let where = keys.reduce(function(previousKey, currentKey, index, array) {
                if (config.fieldsMap.has(currentKey)) {
                    return previousKey + ' and ' + currentKey + '=' + mysqlPool.escape([record[currentKey]]);
                } else {
                    return previousKey;

                }
            }, '');
            //console.log('where:' + where);
            // queries.push('update user_role set ' + query.slice(0, -1) + ' where id=' + mysqlPool.escape([user_role.id]));
            queries.push('delete from ' + config.dbTable + ' where ' + where.slice(4));
        });
        return queries;
    }


};

var executeQueries = function(queries) {
    let results = [];
    if (!Array.isArray(queries) || queries.length === 0) {
        //throw new Error("无操作数据库数据");
        return Promise.resolve(results);
    };
    let currentCon = null;
    return mysqlPool.getConnectionAsync()
        .then(function(con) {
            currentCon = con;
            currentCon.queryAsync = Promise.promisify(currentCon.query);
            currentCon.queryAsync(queries.join(';'));
        })
        .then(function(rows) {
            currentCon.release();
            return Promise.resolve(rows);
        })
        .catch(function(err) {
            //console.log(err);
            //Promise.reject(err);
            //throw new Error(err);
        })
}

var countBackNumber = function(value, isCopy) {
    let backNumber = 0;
    if (!value) { return backNumber; }
    if (Array.isArray(value) && value.length !== 0) {
        if (typeof isCopy === 'boolean' && isCopy === true) { value.shift(); }; //删除记录清除
        backNumber = value
            .map(element => element.affectedRows !== undefined ? element.affectedRows : 0)
            .reduce(function(previousValue, currentValue, index, array) {
                return previousValue + currentValue;
            });
    } else {
        backNumber = value.affectedRows !== undefined ? value.affectedRows : 0;
    };
    return backNumber;
}

var filterImportPostData = function(arrayData) {
    if (!Array.isArray(arrayData) || arrayData.length === 0) {
        return Promise.resolve({});
    };

    let currentCon = null;
    return mysqlPool.getConnectionAsync()
        .then(function(con) {
            currentCon = con;
            currentCon.queryAsync = Promise.promisify(currentCon.query);
            return currentCon.queryAsync('select name FROM user_role');
        })
        .then(function(rows) {
            currentCon.release();
            itemNames = rows.map(item => item.name)
            let oldData = [];
            let newData = [];
            for (item of arrayData) {
                if ((typeof item.name) !== 'string' || item.name.trim() === '') { continue; }
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

router.get('/', function(req, res, next) {
    console.log(config);
    res.render(getFileName(config.routerName, true) + 'index');
});

router.post('/', getCon, function(req, res, next) {

    let selectQueries = [];


    let page = Number.isNaN(parseInt(req.body.page)) ? 1 : parseInt(req.body.page);
    let rows = Number.isNaN(parseInt(req.body.rows)) ? 10 : parseInt(req.body.rows);
    let offset = (page - 1) * rows;

    let dbFields = [];
    for (let key of config.fieldsMap.keys()) {
        dbFields.push(key);
    }

    if (!req.body.name || !req.body.value) {
        selectQueries.push('SELECT count(*) as count FROM ' + config.dbTable);
        selectQueries.push('SELECT ' + dbFields.join(',') + ' FROM ' + config.dbTable + ' limit ' + mysqlPool.escape(offset) + ',' + mysqlPool.escape(rows));
    } else {
        selectQueries.push('SELECT count(*) as count FROM ' + config.dbTable + ' where ' + mysqlPool.escapeId(req.body.name) + ' like "%' + req.body.value.trim() + '%"');
        selectQueries.push('SELECT ' + dbFields.join(',') + ' FROM ' + config.dbTable + ' where ' + mysqlPool.escapeId(req.body.name) + ' like "%' + req.body.value.trim() + '%" limit ' + mysqlPool.escape(offset) + ',' + mysqlPool.escape(rows));
    };

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

router.post('/save', getCon, function(req, res, next) {
    req.body = JSON.parse(req.body.value);

    let executePromise = [null, null, null];
    if (Array.isArray(req.body.insert) && req.body.insert.length !== 0) {
        executePromise[0] = req.dbCon.queryAsync(buildInsertQueries(req.body.insert).join(';'));
    }

    if (Array.isArray(req.body.update) && req.body.update.length !== 0) {
        executePromise[1] = req.dbCon.queryAsync(buildUpdateQueries(req.body.update).join(';'));
    }
    if (Array.isArray(req.body.delete) && req.body.delete.length !== 0) {
        executePromise[2] = req.dbCon.queryAsync(buildDeleteQueries(req.body.delete).join(';'));
    }

    Promise.all(executePromise)
        .then(function(values) {
            let message = '';
            let count = 0;
            count = countBackNumber(values[0]);
            if (count !== 0) {
                message = message + '添加:' + count + '条数据,<br>'
            }
            count = countBackNumber(values[1]);
            if (count !== 0) {
                message = message + '更新:' + count + '条数据,<br>'
            }
            count = countBackNumber(values[2]);
            if (count !== 0) {
                message = message + '删除:' + count + '条数据'
            }
            res.json({
                err: false,
                message: message.slice(0, -1),
            });
        })
        .catch(function(err) {
            next(err);
        })
        .finally(function() {
            req.dbCon.release();
        });
});


router.get('/exportExcel', getCon, function(req, res, next) {
    if (!config.exportAble) { next(); return; };

    req.dbCon.queryAsync('SELECT ' + config.exportExcelFields.join(',') + ' FROM ' + config.dbTable)
        .then(function(result) {
            let data = [];
            let keys = Object.keys(result[0]);
            data.push(keys);
            result.forEach(function(row) {
                let rowValue = [];
                keys.forEach(function(key) {
                    rowValue.push(row[key]);
                });
                data.push(rowValue);
            });

            //发送excel数据
            let wirteBuffer = xlsx.build([{ name: getFileName(config.routerName), data: data }])
            res.setHeader('Content-Type', 'application/vnd.openxmlformats');
            res.setHeader("Content-Disposition", "attachment; filename=" + getFileName(config.routerName) + ".xlsx");
            res.end(wirteBuffer, 'binary');
        })
        .catch(function(err) {
            next(err);
        })
        .finally(function() {
            req.dbCon.release();
        });
});

router.get('/importExcel', function(req, res, next) {
    if (!config.importAble) { next(); return; };
    res.render(getFileName(config.routerName, true) + 'importExcel');
});

router.post('/importExcel', getCon, function(req, res, next) {
    if (!config.importAble) { next(); return; };
    req.body = JSON.parse(req.body.value);
    //数据格式检查
    if (['add', 'update', 'addAndUpdate', 'delete', 'copy'].indexOf(req.body.postType) === -1) {
        res.json({
            err: true,
            message: '导入方式不符合标准'
        });
        return;
    };

    if ((!Array.isArray(req.body.postKeys) || req.body.postKeys.length === 0) && ['update', 'addAndUpdate', 'delete'].indexOf(req.body.postType) !== -1) {
        res.json({
            err: true,
            message: '需要指定导入健'
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
            message: '导入健与数据不符'
        });
        return;
    }



    //针对user_role
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
                    return executeQueries(buildInsertQueries(Data.newData));
                })
                .then(function(value) {
                    res.json({
                        err: false,
                        message: '成功添加:' + countBackNumber(value) + '条数据',
                    });
                    //res.status(200).end();
                });
            break;
        case 'update':
            filterImportPostData(req.body.postData)
                .then(function(Data) {
                    if (Data.oldData === undefined || Data.oldData.length === 0) {
                        return Promise.resolve([]);
                    }
                    return executeQueries(buildUpdateQueries(Data.oldData, ['name']));
                })
                .then(function(value) {
                    res.json({
                        err: false,
                        message: '成功更新:' + countBackNumber(value) + '条数据',
                    });
                    //res.status(200).end();
                });
            break;
        case 'addAndUpdate':
            filterImportPostData(req.body.postData)
                .then(function(Data) {
                    let insertQueries = [];
                    if (Data.newData !== undefined && Data.newData.length !== 0) {
                        insertQueries = buildInsertQueries(Data.newData);
                    }
                    let updateQueries = [];
                    if (Data.oldData !== undefined && Data.oldData.length !== 0) {
                        updateQueries = buildUpdateQueries(Data.oldData, ['name']);
                    }
                    let insertAndUpdateQueries = insertQueries.concat(updateQueries);
                    if (insertAndUpdateQueries.length === 0) {
                        return Promise.resolve([]);
                    } else {
                        return executeQueries(insertAndUpdateQueries);
                    }
                })
                .then(function(value) {
                    res.json({
                        err: false,
                        message: '成功添加及更新:' + countBackNumber(value) + '条数据',
                    });
                    //res.status(200).end();
                });
            break;
        case 'delete':
            filterImportPostData(req.body.postData)
                .then(function(Data) {
                    if (Data.oldData === undefined || Data.oldData.length === 0) {
                        return Promise.resolve([]);
                    }
                    return executeQueries(buildDeleteQueries(Data.oldData, ['name']));
                })
                .then(function(value) {
                    res.json({
                        err: false,
                        message: '成功删除:' + countBackNumber(value) + '条数据',
                    });
                    //res.status(200).end();
                });
            break;
        case 'copy':
            filterImportPostData(req.body.postData)
                .then(function(Data) {
                    let copyData = [];
                    if (Data.newData !== undefined && Data.oldData !== undefined) {
                        copyData = Data.newData.concat(Data.oldData);
                    }
                    if (copyData.length === 0) {
                        return Promise.resolve([]);
                    } else {
                        return executeQueries(['delete FROM user_role'].concat(buildInsertQueries(copyData)));
                    }
                })
                .then(function(value) {
                    res.json({
                        err: false,
                        message: '成功添加:' + countBackNumber(value, true) + '条数据',
                    });
                    //res.status(200).end();
                });
            break;
    }
});


module.exports = function(outConfig) {
    config = Object.assign(config, outConfig); //采用默认值
    return router;
}