var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var chatSchema = new Schema ({
	session: String,
	chatStatus: String,
	startTime: Date,
	chatLog:
	{
		_id: Object,
		user: String,
		message: String
	}
});

module.exports = mongoose.model('Chat',chatSchema);
