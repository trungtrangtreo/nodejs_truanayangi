var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('User', new Schema({ 
	uid: String, 
	deviceId:String,
	name: String, 
	avatar: String,
}));