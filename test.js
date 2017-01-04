// console.log(__dirname);
// console.log(__filename);
// // console.log(__filename.lastIndexOf('\\'));
// // console.log(__filename.lastIndexOf('.'));
// // console.log(__filename.charAt(14));
// // console.log(__filename.charAt(19));
// // console.log(__filename.substr(15, 4));
// console.log(__filename.split('/').pop().split('.')[0]);

var getPathName = function() {
    if (__filename.lastIndexOf('\\') !== -1) {
        return './' + __filename.substr(__filename.lastIndexOf('\\') + 1, __filename.lastIndexOf('.') - __filename.lastIndexOf('\\') - 1) + '/';
    } else {
        return './' + __filename.substr(__filename.lastIndexOf('/') + 1, __filename.lastIndexOf('.') - __filename.lastIndexOf('/') - 1) + '/';
    }
}
console.log(getPathName());