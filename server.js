var BlogEngine = require('./lib/BlogEngine').BlogEngine;
var FileStorage = require('./lib/storage/FileStorage').FileStorage;
var MemoryIndex = require('./lib/index/MemoryIndex').MemoryIndex;
var YAMLPostFactory = require('./lib/factories/YAMLPostFactory').YAMLPostFactory;
var log = require('./lib/log');

var storage = new FileStorage(__dirname + '/posts');
var index = new MemoryIndex();
var postFactory = new YAMLPostFactory();
var blog = new BlogEngine(storage, postFactory, index, null);

blog.serveBlog('127.0.0.1', 4067).done(function(){
	log.info('Blog engine started!');
});