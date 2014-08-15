var YAML = require('js-yaml');
var utils = require('../utils');
var BlogPost = require('../BlogPost').BlogPost;

function YAMLError(originalError){
	this.name = 'YAMLError';
	this.message = 'An error occured while loading a blog post from YAML input data:' + originalError;
	this.errors = [ originalError ];
	Error.captureStackTrace(this, YAMLError);
}
YAMLError.prototype = new Error();

function YAMLPostFactory(){}

YAMLPostFactory.prototype.buildObject = function buildObject(storedData){
	var document;
	try{
		document = YAML.load(storedData, {
			schema: YAML.CORE_SCHEMA
		});
	}
	catch(loadingError){
		throw new YAMLError(loadingError);
	}
	return new BlogPost(document.ID, document.title, document.author, new Date(document.date), document.language, document.paragraphs);
};

module.exports.YAMLPostFactory = YAMLPostFactory;