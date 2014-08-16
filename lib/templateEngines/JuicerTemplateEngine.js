var juice = require('juicer');
var when = require('when');
var utils = require('../utils');
var assert = utils.assert;
var is = utils.is;
var nodefn = require('when/node');
var fs = nodefn.liftAll(require('fs'));
var path = require('path');

function JuicerTemplateEngine(templateDirectory){
	assert(is(templateDirectory, 'string'));
	this._templateDirectory = templateDirectory;
	this._templates = {};
}

JuicerTemplateEngine.prototype.open = function open(){
	var self = this;
	return fs.readdir(self._templateDirectory).then(function(templateFiles){
		return when.all(templateFiles.map(function checkTemplateFile(fileName){
			if(path.extname(fileName) !== '.juice'){
				return;
			}
			return fs.readFile(self._templateDirectory + '/' + fileName).then(function(templateFileContent){
				// Compile the template file contents into a usable renderer.
				self._templates[path.basename(fileName, '.juice')] = juice(templateFileContent.toString('utf-8'));
			});
		}));
	});
};

JuicerTemplateEngine.prototype.render = function render(templateName, data){
	var template = this._templates[templateName];
	assert(template);
	return template.render(data);
};

module.exports.JuicerTemplateEngine = JuicerTemplateEngine;