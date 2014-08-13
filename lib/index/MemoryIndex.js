var when = require('when');
var utils = require('../utils');
var assert = utils.assert;
var is = utils.is;

function MemoryIndexError(originalError){
	this.name = 'MemoryIndexError';
	this.message = 'An error occured while operating on the memory index';
	this.errors = [ originalError ];
	Error.captureStackTrace(this, MemoryIndexError);
}
MemoryIndexError.prototype = new Error();

function EntryType(typeName, significantProperties){
	assert(is(typeName, 'string'));
	assert(is(significantProperties, 'object') && is(significantProperties.length, 'number'));
	this.typeName = typeName;
	this.significantProperties = significantProperties;
}

EntryType.prototype.gatherData = function gatherData(inputObject){
	assert(is(inputObject, 'object') && inputObject !== null);
	return this.significantProperties.reduce(function gatherSignificantValues(gatheredData, currentKey){
		gatheredData[currentKey] = inputObject[currentKey];
		return gatheredData;
	}, {});
};

function MemoryIndex(){
	this.opened = false;
	this.indicesByType = {};
	this.entryTypes = {};
}

MemoryIndex.prototype.open = function open(){
	this.opened = true;
	return when.resolve();
};

MemoryIndex.prototype.defineEntryType = function defineEntryType(typeName, significantProperties){
	assert(is(typeName, 'string'));
	assert(is(significantProperties, 'object') && is(significantProperties.length, 'number'));
	var typeObject = new EntryType(typeName, significantProperties);
	this.entryTypes[typeName] = typeObject;
	this.indicesByType[typeName] = significantProperties.reduce(function createKeyMap(createdMap, currentKey){
		createdMap[currentKey] = {};
		return createdMap;
	}, {});
};

MemoryIndex.prototype.entryTypeDefined = function entryTypeDefined(typeName){
	assert(is(typeName, 'string'));
	return is(this.entryTypes[typeName], 'object');
};

MemoryIndex.prototype._addKeyEntry = function _addKeyEntry(typeName, keyName, keyValue, ID){
	var IDList = (this.indicesByType[typeName][keyName][keyValue] || []).slice();
	IDList.push(ID);
	this.indicesByType[typeName][keyName][keyValue] = IDList;
};

MemoryIndex.prototype.addEntry = function addEntry(typeName, entry){
	if(!this.entryTypeDefined(typeName)){
		throw new MemoryIndexError(new Error('Can not add index entry of a type which has not been defined: ' + typeName));
	}
	assert(is(entry, 'object') && is(entry.getID, 'function'));
	var entryID = entry.getID();
	var indexData = this.entryTypes[typeName].gatherData(entry);
	Object.keys(indexData).forEach(function addIndexEntryForKey(indexKey){
		this._addKeyEntry(typeName, indexKey, indexData[indexKey], entryID);
	}, this);
};

module.exports.MemoryIndex = MemoryIndex;