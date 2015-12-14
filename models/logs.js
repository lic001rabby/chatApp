var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var logSchema = new Schema ({
	sessionId: String,
	userName: String,
	time: String,
	data: String
});

module.exports = mongoose.model('Log',logSchema);

