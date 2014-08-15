var utils = require('./utils');
var assert = utils.assert;
var is = utils.is;
var http = require('http');
var url = require('url');
var when = require('when');

'use strict';

function BlogEngine(postRepository){
	this._postRepository = postRepository;
	this._serving = false;
	this._server = null;
}

BlogEngine.prototype.stopServing = function stopServing(){
	return when.promise((function(resolve, reject){
		if(!this._server){
			return void resolve();
		}
		this._server.once('close', (function markServerAsClosed(){
			this._server = null;
			resolve();
		}).bind(this));
		this._server.once('error', reject);
		this._server.close();
	}).bind(this));
};

BlogEngine.prototype.serveBlog = function serveBlog(host, port, URLPrefix){
	assert(is(host, 'string') || !host);
	assert(is(port, 'number'));
	assert(is(URLPrefix, 'string') || !URLPrefix);
	var self = this;
	
	return self._postRepository.open().then(function(){
		self._server = http.createServer(self.processHTTPRequest.bind(self));
		return when.promise(function startListening(resolve, reject){
			self._server.once('listening', resolve);
			self._server.once('error', reject);
			self._server.listen(port, host);
		});
	});
};

BlogEngine.prototype.processHTTPRequest = function processHTTPRequest(request, response){
	var parsedURL = url.parse(request.url, true);
	var pathname = parsedURL.pathname;
	assert(is(pathname, 'string'));
	
	var postsMatch = pathname.match(/^\/posts\/([a-zA-Z0-9\-]+)$/);
	if(postsMatch){
		response.writeHead(200, 'OK _serving post', {
			'Content-Type': 'application/json'
		});
		//TODO: Implement error handling instead of leaving this to crash nastily.
		this._postRepository.getItems().toArray().done(function(items){
			response.end(JSON.stringify(items));
		});
	}
	else{
		response.writeHead(404, 'Post not found', {
			'Content-Type': 'text/plain'
		});
		response.end('Sorry, there is no post at this page...');
	}
};

module.exports.BlogEngine = BlogEngine;