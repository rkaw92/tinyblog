var utils = require('./utils');
var assert = utils.assert;
var is = utils.is;
var http = require('http');
var url = require('url');
var when = require('when');

function BlogEngine(postProvider, postFactory, indexProvider, layoutFactory){
	this.postProvider = postProvider;
	this.postFactory = postFactory;
	this.indexProvider = indexProvider;
	this.serving = false;
	this.server = null;
}

BlogEngine.prototype.stopServing = function stopServing(){
	return when.promise((function(resolve, reject){
		if(!this.server){
			return void resolve();
		}
		this.server.once('close', function markServerAsClosed(){
			this.server = null;
			resolve();
		});
		this.server.once('error', reject);
		this.server.close();
	}).bind(this));
};

BlogEngine.prototype.serveBlog = function serveBlog(host, port, URLPrefix){
	assert(is(host, 'string') || !host);
	assert(is(port, 'number'));
	assert(is(URLPrefix, 'string') || !URLPrefix);
	var self = this;
	
	return when.all([
		self.postProvider.open(),
		self.indexProvider.open()
	]).then(function registerPostIndex(){
		self.indexProvider.defineEntryType('Post', [ 'author', 'title', 'date' ]);
	}).then(function buildInitialIndex(){
		return self.postProvider.getItemList().then(function(itemList){
			return when.all(itemList.map(function loadItemByID(itemID){
				return self.postProvider.getItem(itemID).then(function createItemObject(item){
					return self.postFactory.getPost(item);
				});
			}));
		}).then(function indexLoadedItems(loadedItems){
			return loadedItems.map(function(item){
				return self.indexProvider.addEntry('Post', item);
			});
		});
	}).then(function(){
		self.server = http.createServer(self.processHTTPRequest.bind(self));
		return when.promise(function startListening(resolve, reject){
			self.server.once('listening', resolve);
			self.server.once('error', reject);
			self.server.listen(port, host);
		});
	});
};

BlogEngine.prototype.processHTTPRequest = function processHTTPRequest(request, response){
	var parsedURL = url.parse(request.url, true);
	var pathname = parsedURL.pathname;
	assert(is(pathname, 'string'));
	
	var postMatch = pathname.match(/^\/post\/([a-zA-Z0-9\-]+)$/);
	if(postMatch){
		response.writeHead(200, 'OK serving post', {
			'Content-Type': 'application/json'
		});
		response.end(JSON.stringify(this.indexProvider));
	}
	else{
		response.writeHead(404, 'Post not found', {
			'Content-Type': 'text/plain'
		});
		response.end('Sorry, there is no post at this page...');
	}
};

module.exports.BlogEngine = BlogEngine;