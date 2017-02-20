var md5 = require('md5');
var xlsx = require('node-xlsx').default;

function createRouter(outConfig) {
    //var Promise = require('bluebird');

    if (!outConfig) { throw new Error('路由器初始化错误'); }
    var config = {};
    config.routerName = ''; //__filename:实际router的文件名
    config.mainIndex = '';
    config.exportAble = false; //boolean 
    config.exportExcelFields = []; //array
    config.importAble = false; //boolean
    config.multiData = true; //boolean
    config.singleData = true; //boolean
    config.initArray = []; // [{ db: 'user_role', fields: ['id', 'name'] }]
    config.viewTable = ''; //db or view
    config.dbTable = '';
    config.fieldsMap = new Map(); //Map()
    //     .set('id', {
    //     readonly: true, //默认false
    //     nullable: false, //默认ture
    //     formatter: 'int', // string,int,float,pass or function(key,value) return[err,value];
    // })



    //覆盖初始值
    config = Object.assign(config, outConfig);
    config.viewTable = config.viewTable === '' ? config.dbTable : config.viewTable;



    var router = require('express').Router();
    //基本函数设置
    router.getFileName = function(fileName, needPath) {
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

    router.formatter = {
        __string: function(key, value) {
            if (!value) { value = '' };
            value = value.toString().trim();
            let err = false;
            if (config.fieldsMap.get(key).nullable === false && value === '') { err = true; };
            return [err, value];
        },
        __boolean: function(key, value) {
            if (value === true || value === 'true') { value = 1 };
            if (value === false || value === 'false') { value = 0 };
            if (value !== 1 && value !== 0) { value = '' };
            let err = false;
            if (config.fieldsMap.get(key).nullable === false && value === '') { err = true; };
            return [err, value];
        },
        __int: function(key, value) {
            if (!Number.isInteger(value)) { value = Number.parseInt(value) };
            let err = false;
            if (config.fieldsMap.get(key).nullable === false && Number.isNaN(value)) { err = true; };
            return [err, value];
        },
        __float: function(key, value) {
            if (typeof value !== 'number') { value = Number.parseFloat(value) };
            let err = false;
            if (config.fieldsMap.get(key).nullable === false && Number.isNaN(value)) { err = true; };
            return [err, value];
        },
        __pass: function(key, value) {
            if (!value) { value = '' };
            if (typeof value !== 'string') { value = value.toString().trim() };
            let err = false;
            if (value.length < 6) {
                err = true;
                value = '';
            } else { value = md5(value) };
            return [err, value];
        },
        __time: function(key, value) {
            if (value instanceof Date) {
                return [false, value];
            } else if (config.fieldsMap.get(key).nullable === true) {
                return [true, null];
            }
            return [true, new Date()];
        },
    };


    router.formatRecord = function(record, errorHanding) {
        for (let key in record) {
            if (!config.fieldsMap.has(key)) {
                delete record[key];
                continue;
            };

            if (config.fieldsMap.get(key).readonly === true) { continue; };

            let err = false;
            if (typeof config.fieldsMap.get(key).formatter === 'string' &&
                typeof router.formatter['__' + config.fieldsMap.get(key).formatter] === 'function') {
                [err, record[key]] = router.formatter['__' + config.fieldsMap.get(key).formatter](key, record[key]);
            } else if (typeof config.fieldsMap.get(key).formatter === 'function') {
                [err, record[key]] = config.fieldsMap.get(key).formatter(key, record[key]);
            };

            if (err && typeof errorHanding === 'function') {
                errorHanding(key, record);
            };
        };
    };

    router.buildInsertQuery = function(record) {
        if (typeof record !== 'object' || Object.keys(record).length === 0) { return '' };
        router.formatRecord(record, function(key, record) {
            throw new Error(key + '值错误:' + record[key]);
        });
        let query = '';
        for (let key in record) {
            if (config.fieldsMap.get(key).readonly === true) { continue; }
            query = query + mysqlPool.escapeId(key) + '=' + mysqlPool.escape(record[key]) + ',';
        }
        if (query.trim() === '') { throw new Error('无有效插入数据,请检查字段设置'); };
        query = 'INSERT INTO ' + config.dbTable + ' SET ' + query.slice(0, -1);
        return query;
    };

    router.buildInsertQueries = function(arrayData) {
        let queries = [];
        if (!Array.isArray(arrayData) || arrayData.length === 0) {
            return queries;
        };
        arrayData.forEach(function(record) {
            let query = router.buildInsertQuery(record);
            if (query !== '') {
                queries.push(query);
            };
        });
        return queries;
    };

    router.buildUpdateQuery = function(record, keys) {
        if (typeof record !== 'object' || Object.keys(record).length === 0) { return '' };
        keys = Array.isArray(keys) && keys.length !== 0 ? keys : ['id'];
        router.formatRecord(record, function(key, record) {
            delete record[key];
        });
        let query = '';
        for (let key in record) {
            if (config.fieldsMap.get(key).readonly === true) { continue; }
            query = query + mysqlPool.escapeId(key) + '=' + mysqlPool.escape(record[key]) + ',';
        };
        if (query.trim() === '') { throw new Error('无有效更新字段,请检查字段设置'); };
        let where = keys.reduce(function(previousKey, currentKey, index, array) {
            if (record[currentKey] !== undefined) {
                return previousKey + ' and ' + mysqlPool.escapeId(currentKey) + '=' + mysqlPool.escape(record[currentKey]);
            } else {
                throw new Error(currentKey + ':未定义');
            };
        }, '');
        if (where.trim() === '') { throw new Error('无有效更新条件,请检查字段设置'); };
        query = 'update ' + config.dbTable + ' set ' + query.slice(0, -1) + ' where ' + where.slice(4);
        return query;
    };

    router.buildUpdateQueries = function(arrayData, keys) {
        let queries = [];
        if (!Array.isArray(arrayData) || arrayData.length === 0) {
            return queries;
        }
        keys = Array.isArray(keys) && keys.length !== 0 ? keys : ['id'];

        arrayData.forEach(function(record) {
            let query = router.buildUpdateQuery(record, keys);
            if (query !== '') {
                queries.push(query);
            }
        });

        return queries;
    };

    router.buildDeleteQuery = function(record, keys) {
        if (typeof record !== 'object' || Object.keys(record).length === 0) { return '' };
        keys = Array.isArray(keys) && keys.length !== 0 ? keys : ['id'];

        let query = ''
        router.formatRecord(record, function(key, record) {
            delete record[key];
        });

        let where = keys.reduce(function(previousKey, currentKey, index, array) {
            if (record[currentKey] !== undefined) {
                return previousKey + ' and ' + mysqlPool.escapeId(currentKey) + '=' + mysqlPool.escape(record[currentKey]);
            } else {
                throw new Error(currentKey + ':未定义');
            };
        }, '');
        if (where.trim() === '') { throw new Error('无有效删除条件,请检查字段设置'); };
        query = 'DELETE FROM ' + config.dbTable + ' WHERE ' + where.slice(4);
        return query;
    };

    router.buildDeleteQueries = function(arrayData, keys) {
        let queries = [];
        if (!Array.isArray(arrayData) || arrayData.length === 0) {
            return queries;
        }
        keys = Array.isArray(keys) && keys.length !== 0 ? keys : ['id'];


        if (keys.indexOf('id') !== -1) {
            let query = '(';
            for (item of arrayData) {
                query = query + mysqlPool.escape(item.id) + ',';
            }
            query = query.slice(0, -1) + ')';
            queries.push('DELETE FROM ' + config.dbTable + ' WHERE id IN ' + query);
            return queries;
        } else {
            arrayData.forEach(function(record) {
                let query = router.buildDeleteQuery(record, keys);
                if (query !== '') {
                    queries.push(query);
                };
            });
            return queries;
        };
    };


    router.countBackNumber = function(value, isCopy) {
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


    router.getCon = function(req, res, next) {
        mysqlPool.getConnection(function(err, con) {
            if (err) { next(err) };
            req.dbCon = con;
            req.dbCon.queryAsync = Promise.promisify(req.dbCon.query);
            next();
        });
    };



    //路由设置

    router.get('/', function(req, res, next) {
        res.redirect(router.getFileName(config.routerName) + '/' + config.mainIndex);
        //console.log(config);
        //res.render(router.getFileName(config.routerName, true) + 'index');
    });


    router.get('/multi', function(req, res, next) {
        if (!config.multiData) { next(); return; };
        routerName = router.getFileName(config.routerName);
        res.render(router.getFileName(config.routerName, true) + 'multi', { routerName: routerName });
    });

    router.post('/multi', router.getCon, function(req, res, next) {
        if (!config.multiData) { next(); return; };



        let page = Number.isNaN(parseInt(req.body.page)) ? 1 : parseInt(req.body.page);
        let rows = Number.isNaN(parseInt(req.body.rows)) ? 10 : parseInt(req.body.rows);
        let offset = (page - 1) * rows;

        let dbFields = [];
        for (let key of config.fieldsMap.keys()) {
            if (config.fieldsMap.get(key).formatter === 'pass') { continue; }
            dbFields.push(key);
        }

        let query = '';
        if (!req.body.name || !req.body.value) {
            query = 'SELECT ' + dbFields.join(',') + ' FROM ' + config.viewTable + ' limit ' + mysqlPool.escape(offset) + ',' + mysqlPool.escape(rows);
        } else {
            query = 'SELECT ' + dbFields.join(',') + ' FROM ' + config.viewTable + ' where ' + mysqlPool.escapeId(req.body.name) + ' like "%' + req.body.value.trim() + '%" limit ' + mysqlPool.escape(offset) + ',' + mysqlPool.escape(rows);
        };

        req.dbCon.queryAsync(query)
            .then(function(rows) {
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

        // let selectQueries = [];
        // if (!req.body.name || !req.body.value) {
        //     selectQueries.push('SELECT count(*) as count FROM ' + config.viewTable);
        //     selectQueries.push('SELECT ' + dbFields.join(',') + ' FROM ' + config.viewTable + ' limit ' + mysqlPool.escape(offset) + ',' + mysqlPool.escape(rows));
        // } else {
        //     selectQueries.push('SELECT count(*) as count FROM ' + config.viewTable + ' where ' + mysqlPool.escapeId(req.body.name) + ' like "%' + req.body.value.trim() + '%"');
        //     selectQueries.push('SELECT ' + dbFields.join(',') + ' FROM ' + config.viewTable + ' where ' + mysqlPool.escapeId(req.body.name) + ' like "%' + req.body.value.trim() + '%" limit ' + mysqlPool.escape(offset) + ',' + mysqlPool.escape(rows));
        // };

        // req.dbCon.queryAsync(selectQueries.join(';'))
        //     .then(function(rows) {
        //         res.json({
        //             total: rows[0][0].count,
        //             rows: rows[1]
        //         });
        //     })
        //     .catch(function(err) {
        //         next(err);
        //     })
        //     .finally(function() {
        //         req.dbCon.release();
        //     });
    });

    router.post('/multi/save', router.getCon, function(req, res, next) {
        req.body = JSON.parse(req.body.value);

        let executePromise = [null, null, null];
        if (Array.isArray(req.body.insert) && req.body.insert.length !== 0) {
            executePromise[0] = req.dbCon.queryAsync(router.buildInsertQueries(req.body.insert).join(';'));
        }

        if (Array.isArray(req.body.update) && req.body.update.length !== 0) {
            executePromise[1] = req.dbCon.queryAsync(router.buildUpdateQueries(req.body.update).join(';'));
        }
        if (Array.isArray(req.body.delete) && req.body.delete.length !== 0) {
            executePromise[2] = req.dbCon.queryAsync(router.buildDeleteQueries(req.body.delete).join(';'));
        }

        Promise.all(executePromise)
            .then(function(values) {
                let message = '';
                let count = 0;
                count = router.countBackNumber(values[0]);
                if (count !== 0) {
                    message = message + '添加:' + count + '条数据,<br> '
                }
                count = router.countBackNumber(values[1]);
                if (count !== 0) {
                    message = message + '更新:' + count + '条数据,<br> '
                }
                count = router.countBackNumber(values[2]);
                if (count !== 0) {
                    message = message + '删除:' + count + '条数据 '
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


    router.get('/exportExcel', router.getCon, function(req, res, next) {
        if (!config.exportAble) { next(); return; };

        req.dbCon.queryAsync('SELECT ' + config.exportExcelFields.join(',') + ' FROM ' + config.viewTable)
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
                let wirteBuffer = xlsx.build([{ name: router.getFileName(config.routerName), data: data }])
                res.setHeader('Content-Type', 'application/vnd.openxmlformats');
                res.setHeader("Content-Disposition", "attachment; filename=" + router.getFileName(config.routerName) + ".xlsx");
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
        res.render(router.getFileName(config.routerName, true) + 'importExcel');
    });





    //需要改良;构建SelectQuery进行查询
    router.filterImportPostData = function(arrayData, keys) {
        if (!Array.isArray(arrayData) || arrayData.length === 0) {
            return Promise.resolve({});
        };

        let currentCon = null;
        return mysqlPool.getConnectionAsync()
            .then(function(con) {
                currentCon = con;
                currentCon.queryAsync = Promise.promisify(currentCon.query);
                return currentCon.queryAsync('SELECT ' + keys[0] + ' FROM ' + config.viewTable);
            })
            .then(function(rows) {
                currentCon.release();
                itemNames = rows.map(item => item[keys[0]])
                let oldData = [];
                let newData = [];
                for (item of arrayData) {
                    if (itemNames.indexOf(item[keys[0]]) === -1) {
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
    router.post('/importExcel', router.getCon, function(req, res, next) {
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



        //目前仅支持单一key
        if (req.body.postKeys.length > 1) {
            res.json({
                err: true,
                message: 'postKeys 错误'
            });
            return;
        }



        req.dbCon.beginTransactionAsync = Promise.promisify(req.dbCon.beginTransaction);
        req.dbCon.commitAsync = Promise.promisify(req.dbCon.commit);
        req.dbCon.rollbackAsync = Promise.promisify(req.dbCon.rollback);
        switch (req.body.postType) {
            case 'add':
                req.dbCon.beginTransactionAsync()
                    .then(function() {
                        return router.filterImportPostData(req.body.postData, req.body.postKeys)
                    })
                    .then(function(Data) {
                        if (Data.newData === undefined || Data.newData.length === 0) {
                            return Promise.resolve([]);
                        }
                        return req.dbCon.queryAsync(router.buildInsertQueries(Data.newData).join(';'));
                    })
                    .then(function(value) {
                        res.json({
                            err: false,
                            message: '成功添加:' + router.countBackNumber(value) + '条数据',
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


                // router.filterImportPostData(req.body.postData, req.body.postKeys)
                //     .then(function(Data) {
                //         if (Data.newData === undefined || Data.newData.length === 0) {
                //             return Promise.resolve([]);
                //         }
                //         return req.dbCon.queryAsync(router.buildInsertQueries(Data.newData).join(';'));
                //     })
                //     .then(function(value) {
                //         res.json({
                //             err: false,
                //             message: '成功添加:' + router.countBackNumber(value) + '条数据',
                //         });
                //         //res.status(200).end();
                //     })
                //     .catch(function(err) {
                //         next(err);
                //     })
                //     .finally(function() {
                //         req.dbCon.release();
                //     });





                break;
            case 'update':
                req.dbCon.beginTransactionAsync()
                    .then(function() {
                        return router.filterImportPostData(req.body.postData, req.body.postKeys)
                    })
                    .then(function(Data) {
                        if (Data.oldData === undefined || Data.oldData.length === 0) {
                            return Promise.resolve([]);
                        }
                        return req.dbCon.queryAsync(router.buildUpdateQueries(Data.oldData, req.body.postKeys).join(';'));
                    })
                    .then(function(value) {
                        res.json({
                            err: false,
                            message: '成功更新:' + router.countBackNumber(value) + '条数据',
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
                break;
            case 'addAndUpdate':
                req.dbCon.beginTransactionAsync()
                    .then(function() {
                        return router.filterImportPostData(req.body.postData, req.body.postKeys)
                    })
                    .then(function(Data) {
                        let insertQueries = [];
                        if (Data.newData !== undefined && Data.newData.length !== 0) {
                            insertQueries = router.buildInsertQueries(Data.newData);
                        }
                        let updateQueries = [];
                        if (Data.oldData !== undefined && Data.oldData.length !== 0) {
                            updateQueries = router.buildUpdateQueries(Data.oldData, req.body.postKeys);
                        }
                        let insertAndUpdateQueries = insertQueries.concat(updateQueries);
                        if (insertAndUpdateQueries.length === 0) {
                            return Promise.resolve([]);
                        } else {
                            return req.dbCon.queryAsync(insertAndUpdateQueries.join(';'));
                        }
                    })
                    .then(function(value) {
                        res.json({
                            err: false,
                            message: '成功添加及更新:' + router.countBackNumber(value) + '条数据',
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
                break;
            case 'delete':
                req.dbCon.beginTransactionAsync()
                    .then(function() {
                        return router.filterImportPostData(req.body.postData, req.body.postKeys)
                    })
                    .then(function(Data) {
                        if (Data.oldData === undefined || Data.oldData.length === 0) {
                            return Promise.resolve([]);
                        }
                        return req.dbCon.queryAsync(router.buildDeleteQueries(Data.oldData, req.body.postKeys).join(';'));
                    })
                    .then(function(value) {
                        res.json({
                            err: false,
                            message: '成功删除:' + router.countBackNumber(value) + '条数据',
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
                break;
            case 'copy':
                req.dbCon.beginTransactionAsync()
                    .then(function() {
                        return router.filterImportPostData(req.body.postData, req.body.postKeys)
                    })
                    .then(function(Data) {
                        let copyData = [];
                        if (Data.newData !== undefined && Data.oldData !== undefined) {
                            copyData = Data.newData.concat(Data.oldData);
                        }
                        if (copyData.length === 0) {
                            return Promise.resolve([]);
                        } else {
                            return req.dbCon.queryAsync((['DELETE FROM ' + config.dbTable].concat(router.buildInsertQueries(copyData))).join(';'));
                        }
                    })
                    .then(function(value) {
                        res.json({
                            err: false,
                            message: '成功添加:' + router.countBackNumber(value, true) + '条数据',
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
                break;
        }
    });


    router.post('/initData', router.getCon, function(req, res, next) {
        if (!Array.isArray(config.initArray) || config.initArray.length === 0) { next(); return; }
        let selectQueries = [];
        config.initArray.forEach(function(item) {
            selectQueries.push('SELECT ' + item.fields.join(',') + ' FROM ' + item.db);
        })
        req.dbCon.queryAsync(selectQueries.join(';'))
            .then(function(rows) {
                //console.log(rows);
                res.json({
                    err: false,
                    message: '初始化成功',
                    result: rows
                })
            })
            .catch(function(err) {
                next(err);
            })
            .finally(function() {
                req.dbCon.release();
            });

    });


    return [config, router];
}

module.exports = createRouter;