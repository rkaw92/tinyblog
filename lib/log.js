var colors = require('colors');

module.exports.info = function info(args){
	console.log.apply(console, ['[INFO]'.green].concat(Array.prototype.slice.call(arguments)));
};