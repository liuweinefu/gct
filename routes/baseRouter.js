var express = require('express');
var router = express.Router();
var md5 = require('md5');
var xlsx = require('node-xlsx').default;
//var Promise = require('bluebird');


var config = {};
config.routerName = ''; //__filename
config.exportExcelFields = []; //' name,user_role_id,phone,other_contacts,remark FROM user'
config.mainTable = ''; //'user'
config.assistantTableArray = []; //[user_role]




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

var buildInsertQueries = function(arrayData) {
    let queries = [];
    if (!Array.isArray(arrayData) || arrayData.length === 0) {
        return queries;
    }
    for (item of arrayData) {
        if ((typeof item.name) !== 'string' || item.name.trim() === '') { continue; }
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

        queries.push('insert into member_role set ' + query.slice(0, -1));
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
        if ((typeof item.name) !== 'string' || item.name.trim() === '') { continue; }

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
        // queries.push('update user_role set ' + query.slice(0, -1) + ' where id=' + mysqlPool.escape([user_role.id]));
        queries.push('update member_role set ' + query.slice(0, -1) + ' where ' + where.slice(4));
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
        queries.push('delete from member_role where id in ' + query);
        return queries;
    } else {
        let query = ''
        for (item of arrayData) {
            let where = keys.reduce(function(previousKey, currentKey, index, array) {
                return previousKey + ' and ' + currentKey + '=' + mysqlPool.escape([item[currentKey]]);
            }, '');
            //console.log('where:' + where);
            // queries.push('update user_role set ' + query.slice(0, -1) + ' where id=' + mysqlPool.escape([user_role.id]));
            queries.push('delete from member_role where ' + where.slice(4));
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
    queryString = 'SELECT ' + config.exportExcelFields.join(',') + ' FROM ' + config.mainView;
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