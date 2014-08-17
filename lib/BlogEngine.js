var utils = require('./utils');
var assert = utils.assert;
var is = utils.is;
var http = require('http');
var url = require('url');
var when = require('when');

'use strict';

function BlogEngine(postRepository, templateEngine){
	this._postRepository = postRepository;
	this._templateEngine = templateEngine;
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
	
	return when.all([
		self._postRepository.open(),
		self._templateEngine.open()
	]).then(function(){
		self._server = http.createServer(self.processHTTPRequest.bind(self));
		return when.promise(function startListening(resolve, reject){
			self._server.once('listening', resolve);
			self._server.once('error', reject);
			self._server.listen(port, host);
		});
	});
};

BlogEngine.prototype.processHTTPRequest = function processHTTPRequest(request, response){
	var self = this;
	var parsedURL = url.parse(request.url, true);
	var pathname = parsedURL.pathname;
	assert(is(pathname, 'string'));
	
	var postMatch = pathname.match(/^\/posts\/([a-zA-Z0-9\-]+)$/);
	if(postMatch){
		//TODO: Implement error handling instead of leaving this to crash nastily.
		this._postRepository.getItemByID(postMatch[1]).done(function(postData){
			response.writeHead(200, 'OK, serving post', {
				'Content-Type': 'text/html; charset=utf-8'
			});
			response.end(self._templateEngine.render('Post', postData));
		}, function itemRetrievalError(error){
			//TODO: Implement error type recognition in Repositories so that a "file not found" case may be supported separately from generic errors.
			response.writeHead(500, 'Error serving post', {
				'Content-Type': 'application/json'
			});
			response.end(JSON.stringify(error));
		});
	}
	else if(pathname === '/' || pathname.length === 0){
		this._postRepository.getItems().toArray().done(function handlePostListResults(results){
			response.writeHead(200, 'OK, serving index');
			response.end(self._templateEngine.render('PostIndex', { posts: results }));
		}, function handlePostListError(error){
			response.writeHead(500, 'Error serving post list', {
				'Content-Type': 'application/json'
			});
			response.end(JSON.stringify(error));
		});
	}
	else{
		response.writeHead(404, 'No such path', {
			'Content-Type': 'text/plain'
		});
		response.end('There is no handler defined for the supplied URI. Please go back to the root directory (/) of this HTTP server and try seeing other resources.');
	}
};

module.exports.BlogEngine = BlogEngine;