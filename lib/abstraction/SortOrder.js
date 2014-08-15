var utils = require('../utils');
var assert = utils.assert;
var is = utils.is;

/**
 * A SortField is an internal representation of an ordering to be given to records based on the value of some field.
 * @param {string} fieldName Name of the field to compare when sorting.
 * @param {boolean} ascending Whether an ascending order is desired. If false, descending order (highest first, lowest last) is assumed.
 * @constructor
 */
function SortField(fieldName, ascending){
	assert(is(fieldName, 'string'));
	assert(is(ascending, 'boolean'));
	this.fieldName = fieldName;
	this.ascending = ascending;
}

/**
 * A custom sort field specification tells the backend that the caller wants records to be retrieved according to a particular order of values in the checked field.
 * @param {string} fieldName The field name to use for comparisons.
 * @param {Array} valueOrder An array specifying desired record order. Within the sorting operation, records which have the field value represented at lower indices in the array will be returned first. If a value found in a row is not present in the specification, it is returned last, along with other rows, with no particular order among the "unclassified" ones.
 * @constructor
 */
function SortFieldCustom(fieldName, valueOrder){
	assert(is(fieldName, 'string'));
	assert(valueOrder && is(valueOrder, 'object') && is(valueOrder.length, 'number'));
	this.fieldName = fieldName;
	this.valueOrder = valueOrder;
}

function orderStringToObject(fieldSpecification){
	assert(is(fieldSpecification, 'string'));
	var colonPosition = fieldSpecification.lastIndexOf(':');
	// Make sure that we have found a colon (>= 0) and that the part before it is not empty (> 0).
	assert(colonPosition > 0);
	var fieldName = fieldSpecification.slice(0, colonPosition);
	var orderWord = fieldSpecification.slice(colonPosition + 1);
	assert(orderWord === 'asc' || orderWord === 'desc');
	if(orderWord === 'asc'){
		return new SortField(fieldname, true);
	}
	else{
		return new SortField(fieldName, false);
	}
}

/**
 * A sort order represents a list of sort criteria (being sort fields). It is a complete sorting specification and may be used for querying repositories.
 * @param {Array.<(SortField|SortFieldCustom|string)>} fieldSpecifications An array of field specifications, in order of evaluation from the lowest indices to the highest. Two forms are acceptable: a ready-made object specification, or a string of the form "fieldName:order", where order is either "asc" or "desc". If a string is passed, it is turned into a SortField and subsequently evaluated as one.
 * @constructor
 */
function SortOrder(fieldSpecifications){
	assert(fieldSpecifications && is(fieldSpecifications, 'object') && is(fieldSpecifications.length, 'number') && is(fieldSpecifications.forEach, 'function'));
	this.sortFields = fieldSpecifications.map(function processFieldSpec(field){
		if(is(field, 'string')){
			return orderStringToObject(field);
		}
		assert(field.fieldName && (is(field.ascending, 'boolean') || is(field.valueOrder, 'object')));
		return field;
	});
}

module.exports.SortOrder = SortOrder;
module.exports.SortField = SortField;
module.exports.SortFieldCustom = SortFieldCustom;