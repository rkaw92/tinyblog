var utils = require('../utils');
var when = require('when');
var is = utils.is;
var assert = utils.assert;

function sortOrderToSortPredicate(sortOrder){
	//TODO: Implement custom order support.
	//TODO: Implement type-aware Date object comparisons.
	assert(sortOrder && is(sortOrder, 'object') && is(sortOrder.sortFields, 'object') && is(sortOrder.reduceRight, 'function'));
	// Build a sorting function by chaining field order predicates: if an earlier predicate returns 0 (equality), call the next function in the chain.
	return sortOrder.reduceRight(function(nextComparison, currentSortField){
		return function compareRecords(a, b){
			var fieldName = currentSortField.fieldName;
			// 
			if(a[fieldName] < b[fieldName]){
				return ascending ? -1 : 1;
			}
			if(a[fieldName] > b[fieldName]){
				return ascending ? 1 : -1;
			}
			return nextComparison(a, b);
		}
	}, function fallbackToEquality(a, b){
		return 0;
	});
}

function FileRepositoryCursor(repository){
	this._repository = repository;
	this._materialized = false;
	this._criteria = null;
	this._sortOrder = null;
	this._projection = null;
	this._offset = null;
	this._count = null;
	this._resultArrayPromise = null;
}

function limitFields(entries, fieldList){
	assert(entries && is(entries, 'object') && is(entries.map, 'function'));
	assert(fieldList && is(fieldList, 'object') && is(fieldList.reduce, 'function'));
	return entries.map(function limitFieldsForEntry(entry){
		// Produce an object carrying only the listed fields from the entry:
		return fieldList.reduce(function filterFields(filtered, currentField){
			filtered[currentField] = entry[currentField];
			return filtered;
		}, {});
	});
}

FileRepositoryCursor.prototype._getIndexForQuery = function _getIndexForQuery(){
	var self = this;
	return self._repository.getIndex().getEntries(self._repository.getEntryType(), self._criteria).then(function sortEntriesOptionally(indexEntries){
		// Sort by the elements belonging to the index.
		if(self._sortOrder){
			indexEntries.sort(sortOrderToSortPredicate(self._sortOrder));
		}
		return indexEntries;
	}).then(function sliceEntriesOptionally(indexEntries){
		if(is(self._offset, 'number')){
			indexEntries = indexEntries.slice(self._offset);
		}
		if(is(self._count, 'number')){
			indexEntries = indexEntries.slice(0, self._count);
		}
		return indexEntries;
	});
};

FileRepositoryCursor.prototype.toArray = function toArray(){
	var self = this;
	// Guard clause: check if our index query has materialized.
	if(self._materialized){
		return this._resultArrayPromise;
	}
	
	// Before starting, mark as materialized so that the query is not repeated.
	this._materialized = true;
	// First, use the criteria to query the index.
	var arrayPromise = self._getIndexForQuery().then(function loadFullEntries(indexEntries){
		// Retrieve the full list of entry body blobs, rather than just their index placeholders.
		var storage = self._repository.getStorage();
		return when.all(indexEntries.map(function getEntryBlob(indexEntry){
			return storage.getItem(indexEntry.ID);
		}));
	}).then(function restoreEntriesByFactory(entryBlobs){
		var factory = self._repository.getFactory();
		return entryBlobs.map(function restoreEntry(blob){
			return factory.buildObject(blob);
		});
	}).then(function projectEntriesOptionally(entries){
		if(self._projection){
			entries = limitFields(entries, self._projection);
		}
		return entries;
	});
	// Immediately save the result promise so that subsequent queries may simply retrieve it.
	this._resultArrayPromise = arrayPromise;
	
	return arrayPromise;
};

function FileRepository(entryType, indexedFields, storageBackend, indexBackend, factoryBackend){
	this._entryType = entryType;
	this._indexedFields = indexedFields;
	this._storage = storageBackend;
	this._index = indexBackend;
	this._factory = factoryBackend;
}

FileRepository.prototype.open = function open(){
	var self = this;
	return when.all([ self._storage.open(), self._index.open() ]).then(function defineIndexEntryType(){
		return self._index.defineEntryType(self._entryType, self._indexedFields);
	}).then(function populateIndexFromFiles(){
		return self._storage.getItemList().then(function getItemContents(IDs){
			return when.all(IDs.map(self._storage.getItem.bind(self._storage)));
		}).then(function restoreItemsFromBlobs(blobs){
			return blobs.map(self._factory.buildObject.bind(self._factory));
		}).then(function addItemsToIndex(items){
			return when.all(items.map(self._index.addItemEntry.bind(self._index, self._entryType)));
		});
	});
};

FileRepository.prototype.getIndex = function getIndex(){
	return this._index;
};

FileRepository.prototype.getStorage = function getStorage(){
	return this._storage;
};

FileRepository.prototype.getFactory = function getFactory(){
	return this._factory;
};

FileRepository.prototype.getEntryType = function getEntryType(){
	return this._entryType;
};

FileRepository.prototype.getItemByID = function getItemByID(ID){
	var self = this;
	return self._storage.getItem(ID).then(function processRetrievedBlob(blob){
		return self._factory.buildObject(blob);
	});
};

FileRepository.prototype.getItems = function getItems(){
	return new FileRepositoryCursor(this);
};

module.exports.FileRepository = FileRepository;