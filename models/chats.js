var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var chatSchema = new Schema ({
	sessionName: String,
	chatStatus: String,
	startTime: String,
	endTime: String
});

module.exports = mongoose.model('Chat',chatSchema);

