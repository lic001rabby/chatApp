var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var chatSchema = new Schema ({
	sessionName: String,
	chatStatus: String,
	startTime: Date
});

module.exports = mongoose.model('Chat',chatSchema);

