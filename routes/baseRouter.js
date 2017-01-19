var express = require('express');
var router = express.Router();
var md5 = require('md5');
var xlsx = require('node-xlsx').default;
//var Promise = require('bluebird');


var config = {};
config.routerName = ''; //__filename
config.exportExcelFields = []; //' name,user_role_id,phone,other_contacts,remark FROM user'
config.dbTable = ''; //'user'
config.fieldsMap = new Map(); //[user_role]




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
}

var getCon = function(req, res, next) {
    mysqlPool.getConnection(function(err, con) {
        if (err) { next(err) };
        req.dbCon = con;
        req.dbCon.queryAsync = Promise.promisify(req.dbCon.query);
        next();
    });
}





var formatRecord = function(record) {
    //fieldsMap's Key Format Function
    var _formatString = function(value) {
        if (typeof value !== 'string') { value = value.toString().trim() };
        return value;
    }

    var _formatInt = function(value) {
        if (!Number.isInteger(value)) { value = Number.parseInt(value) };
        if (Number.isNaN(value)) {
            throw new Error("数据类型错误:" + value);
        } else {
            return value;
        }

    }
    var _formatFloat = function(value) {
        if (typeof value !== 'number') { value = Number.parseFloat(value) };
        if (Number.isNaN(value)) {
            throw new Error("数据类型错误:" + value);
        } else {
            return value;
        }
    }

    var _formatPass = function(value) {
        if (typeof value !== 'string') { value = value.toString().trim() };
        if (value.length < 6) { return '' };
        return md5(value);
    }


    for (let key in record) {
        if (!config.fieldsMap.has(key)) { continue; }
        if (typeof config.fieldsMap.get(key).formatter !== 'string' ||
            typeof config.fieldsMap.get(key).formatter !== 'function') { continue; }
        switch (config.fieldsMap.get(key).formatter) {
            case 'string':
                record[key] = _formatString(record[key]);
                break;
            case 'int':
                record[key] = _formatInt(record[key]);
                break;
            case 'float':
                record[key] = _formatFloat(record[key]);
                break;
            case 'pass':
                record[key] = _formatPass(record[key]);
                break;
            default:
                record[key] = typeof config.fieldsMap.get(key).formatter === 'function' ? config.fieldsMap.get(key).formatter(record[key]) : record[key];
        }
    }

}

var buildInsertQueries = function(arrayData) {
    let queries = [];
    if (!Array.isArray(arrayData) || arrayData.length === 0) {
        return queries;
    }

    arrayData.forEach(function(record) {
        formatRecord(record);
        let query = '';
        for (let key in record) {
            if (!config.fieldsMap.has(key)) { continue; }
            if (config.fieldsMap.get(key).updateAble === false) { continue; }
            switch (key) {
                case 'id':
                    continue;
                case 'pass':
                    if (typeof record[key] !== 'string' || record[key].length === 0) {
                        if (!config.fieldsMap.get(key).defaultValue) { return; }
                        record[key] = md5(config.fieldsMap.get(key).defaultValue);
                        continue;
                    }
                case 'name':
                    if (typeof record[key] !== 'string' || record[key].length === 0) {
                        return;
                    }

            }
            query = query + mysqlPool.escapeId(key) + '=' + mysqlPool.escape(record[key]) + ',';
        }
        queries.push('insert into ' + config.dbTable + ' ' + query.slice(0, -1));
        return;
    })

    return queries;
};

var buildUpdateQueries = function(arrayData, keys) {
    let queries = [];
    if (!Array.isArray(arrayData) || arrayData.length === 0) {
        return queries;
    }
    keys = Array.isArray(keys) && keys.length !== 0 ? keys : ['id'];


    arrayData.forEach(function(record) {
        formatRecord(record);
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
            formatRecord(record);

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
            throw err;
        })
}




router.get('/', function(req, res, next) {
    res.render(getFileName(config.routerName, true) + 'index');
});

router.get('/importExcel', function(req, res, next) {
    res.render(getFileName(config.routerName, true) + 'importExcel');
});

router.get('/exportExcel', getCon, function(req, res, next) {
    console.log(typeof config.exportExcelQuery);
    if (!req.dbCon) { next(new Error('数据库初始化错误')) };
    queryString = 'SELECT ' + config.exportExcelFields.join(',') + ' FROM ' + config.dbTable;
    req.dbCon.queryAsync(queryString)
        .then(function(result) {
            req.dbCon.release();
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
            next();
        })
        .catch(function(err) {
            next(err);
        });
});





module.exports = function(outConfig) {

    config = outConfig;
    return router;
}