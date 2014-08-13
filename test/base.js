var BlogEngine = require('../lib/BlogEngine').BlogEngine;
var FileStorage = require('../lib/storage/FileStorage').FileStorage;
var MemoryIndex = require('../lib/index/MemoryIndex').MemoryIndex;
var YAMLPostFactory = require('../lib/factories/YAMLPostFactory').YAMLPostFactory;

describe('BlogEngine', function(){
	describe('#serveBlog', function(){
		it('should start serving a site accessible over HTTP', function(){
			var storage = new FileStorage('/tmp');
			var index = new MemoryIndex();
			var postFactory = new YAMLPostFactory();
			var blog = new BlogEngine(storage, postFactory, index, null);
			return blog.serveBlog('127.0.0.1', 4066);
		});
	});
});