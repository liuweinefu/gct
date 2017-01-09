main = require('./routes/baseRoute');
a = new Date()
console.log(main.getPathName());
console.log(new Date() - a);

console.log(main.getFileName(__filename));
console.log(new Date() - a);