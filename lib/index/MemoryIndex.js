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

function MemoryIndexEntry(ID, properties){
	assert(is(ID, 'string'));
	assert(is(properties, 'object'));
	this.ID = ID;
	this.properties = properties;
};

function isDate(inspectedObject){
	return inspectedObject && is(inspectedObject, 'object') && is(inspectedObject.getTime, 'function');
}

function MemoryIndex(){
	this._opened = false;
	this._indicesByType = {};
	this._entryTypes = {};
}

MemoryIndex.prototype.open = function open(){
	this._opened = true;
	return when.resolve();
};

MemoryIndex.prototype.defineEntryType = function defineEntryType(typeName, significantProperties){
	assert(is(typeName, 'string'));
	assert(is(significantProperties, 'object') && is(significantProperties.length, 'number'));
	var typeObject = new EntryType(typeName, significantProperties);
	this._entryTypes[typeName] = typeObject;
	this._indicesByType[typeName] = significantProperties.reduce(function createKeyMap(createdMap, currentKey){
		createdMap[currentKey] = {};
		return createdMap;
	}, {});
	// Add a special, key-less "index" that will just list all items of a given type.
	this._indicesByType[typeName].$all = [];
};

MemoryIndex.prototype.entryTypeDefined = function entryTypeDefined(typeName){
	assert(is(typeName, 'string'));
	return is(this._entryTypes[typeName], 'object');
};

MemoryIndex.prototype._addKeyEntry = function _addKeyEntry(typeName, keyName, keyValue, ID){
	if(isDate(keyValue)){
		keyValue = keyValue.getTime();
	}
	var IDList = (this._indicesByType[typeName][keyName][keyValue] || []).slice();
	IDList.push(ID);
	this._indicesByType[typeName][keyName][keyValue] = IDList;
};

MemoryIndex.prototype.addItemEntry = function addItemEntry(typeName, item){
	if(!this.entryTypeDefined(typeName)){
		throw new MemoryIndexError(new Error('Can not add index entry for an item type which has not been defined: ' + typeName + '. Use defineEntryType first.'));
	}
	console.log('Adding index entry for:', item);
	assert(is(item, 'object') && is(item.getID, 'function'));
	var entryObjectID = item.getID();
	assert(entryObjectID && is(entryObjectID.ID, 'string'));
	var entryID = entryObjectID.ID;
	var indexData = this._entryTypes[typeName].gatherData(item);
	var indexEntry = new MemoryIndexEntry(entryID, indexData);
	// For each of the significant fields defined for this entry type, add a reference in the corresponding field index.
	Object.keys(indexData).forEach(function addIndexEntryForKey(indexKey){
		this._addKeyEntry(typeName, indexKey, indexData[indexKey], indexEntry);
	}, this);
	// Also register the item in the global item list (field-less index).
	this._indicesByType[typeName].$all.push(indexEntry);
};

MemoryIndex.prototype.getEntries = function getEntries(typeName, predicates){
	//TODO: Define predicate types and implement support for them in this index backend.
	assert(this._indicesByType[typeName]);
	var allEntries = this._indicesByType[typeName].$all;
	return when.resolve(allEntries);
};

//TODO: Deprecate getEntryRange.
MemoryIndex.prototype.getEntryRange = function getEntryRange(typeName, keyName, min, max){
	assert(is(typeName, 'string'));
	assert(is(key, 'string'));
	assert(this._indicesByType[typeName] && this._indicesByType[typeName][keyName]);
	if(isDate(min) && isDate(max)){
		min = min.getTime();
		max = max.getTime();
	}
	var allEntries = this._indicesByType[typeName][keyName];
	var matchingIDs = Object.keys(allEntries).reduce(function findMatchingKeyValues(foundIDs, currentKeyValue){
		if(currentKeyValue >= min && currentKeyValue <= max){
			allEntries[currentKeyValue].forEach(function(entryID){
				foundIDs[entryID] = currentKeyValue;
			});
		}
	}, {});
	return Object.keys(matchingIDs);
};

module.exports.MemoryIndex = MemoryIndex;