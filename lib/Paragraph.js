function Paragraph(headline, content){
	assert(is(headline, 'string'));
	assert(is(content, 'string'));
	
	this.ID = new ID();
	this.headline = headline;
	this.content = content;
}

module.exports.Paragraph = Paragraph;