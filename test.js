        keys = ['id', 'm'];
        let where = keys.reduce(function(previousKey, currentKey, index, array) {
            return previousKey + ' and ' + currentKey + '=xxx';
        }, '');
        console.log(where);