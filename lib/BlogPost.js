var utils = require('./utils');
var ObjectID = utils.ObjectID;
var assert = utils.assert;
var is = utils.is;


function BlogPost(ID, title, author, date, language, paragraphs){
	assert(!ID || is(ID, 'string'));
	assert(is(title, 'string'));
	assert(is(author, 'string'));
	assert(is(date.getSeconds, 'function') && !isNaN(date.getSeconds()));
	assert(is(language, 'string'));
	assert(is(paragraphs.every, 'function'));
	assert(paragraphs.every(function(paragraph){
		return is(paragraph.headline, 'string') && is(paragraph.content, 'string');
	}));

	this.ID = new ObjectID(ID);
	this.title = title;
	this.author = author;
	this.date = new Date(date);
	this.language = String(language);
}

BlogPost.prototype.getID = function getID(){
	return this.ID;
};

module.exports.BlogPost = BlogPost;