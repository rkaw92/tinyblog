var BlogEngine = require('./lib/BlogEngine').BlogEngine;
var FileStorage = require('./lib/storage/FileStorage').FileStorage;
var MemoryIndex = require('./lib/index/MemoryIndex').MemoryIndex;
var YAMLPostFactory = require('./lib/factories/YAMLPostFactory').YAMLPostFactory;
var FileRepository = require('./lib/repositories/FileRepository').FileRepository;
var log = require('./lib/log');

var postStorage = new FileStorage(__dirname + '/posts');
var postIndex = new MemoryIndex();
var postFactory = new YAMLPostFactory();
var postRepository = new FileRepository('Post', ['ID', 'author', 'date', 'title', 'language'], postStorage, postIndex, postFactory);

var blog = new BlogEngine(postRepository);

blog.serveBlog('127.0.0.1', 4067).done(function(){
	log.info('Blog engine started! Listening on http://127.0.0.1:4067');
});