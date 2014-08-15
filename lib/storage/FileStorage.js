var utils = require('../utils');
var assert = utils.assert;
var is = utils.is;
var when = require('when');
var nodeFunction = require('when/node');
var callbacks = require('when/callbacks');
var fs = nodeFunction.liftAll(require('fs'));
var callbackFS = callbacks.liftAll(require('fs'));
var path = require('path');

function FileStorageError(originalError){
	this.name = 'FileStorageError';
	this.message = 'An error has occured when initializing or operating the file storage back-end: ' + originalError;
	this.errors = [ originalError ];
	Error.captureStackTrace(this, originalError);
}
FileStorageError.prototype = new Error();

function FileStorage(directory){
	assert(is(directory, 'string'));
	this.directory = directory;
	this.opened = false;
}

FileStorage.prototype.open = function open(){
	var directory = this.directory;
	return callbackFS.exists(directory).then((function(exists){
		if(!exists){
			throw new Error('Directory does not exist: ' + directory);
		}
		this.opened = true;
	}).bind(this)).catch(function(error){
		throw new FileStorageError(error);
	});
};

FileStorage.prototype.getItem = function getItem(ID){
	var itemID = new utils.ObjectID(ID);
	if(!this.opened){
		throw new FileStorageError(new Error('File storage not opened yet - call the open() method and wait for promise resolution first'));
	}
	if(path.basename(itemID.ID) !== itemID.ID){
		throw new FileStorageError(new Error('Filesystem security violation: trying to access a non-basename path: ' + itemID));
	}
	
	return fs.readFile(this.directory + '/' + itemID.ID).catch(function(error){
		throw new FileStorageError(error);
	});
};

FileStorage.prototype.getItemList = function getItemList(){
	if(!this.opened){
		throw new FileStorageError(new Error('File storage not opened yet - call the open() method and wait for promise resolution first'));
	}
	return fs.readdir(this.directory).then().catch(function(error){
		return new FileStorageError(error);
	});
};

module.exports.FileStorage = FileStorage;