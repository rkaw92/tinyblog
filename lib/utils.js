function is(value, type){
	return typeof(value) === type;
}

function ObjectID(existingID){
	if(!(this instanceof ObjectID)){
		return new ObjectID(existingID);
	}
	assert(!existingID || is(existingID, 'string') || is(existingID.ID, 'string'));
	if(!existingID){
		this.ID = uuid.v4();
		return;
	}
	if(is(existingID, 'string')){
		this.ID = existingID;
	}
	if(is(existingID.ID, 'string')){
		this.ID = existingID.ID;
	}
}

/**
 * Require that a condition be fulfilled. Throws an error otherwise.
 */

function AssertionError(message){
	this.message = message;
	this.code = 119;
	if(Error.captureStackTrace){
		Error.captureStackTrace(this, AssertionError);
	}
}
AssertionError.prototype = new Error();

function assert(condition){
	if(!condition){
		throw new AssertionError('Assertion failed');
	}
}

module.exports.assert = assert;
module.exports.is = is;
module.exports.ObjectID = ObjectID;