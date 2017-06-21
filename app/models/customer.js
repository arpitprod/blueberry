var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var customerSchema = new Schema({
	userId: String,
	fromLocation: [Number],
	toLocation: [Number],
	startTime: Date,
	endTime: Date,
	isPink: Boolean,
	cabCharge: Number
});
// customerSchema.index({ fromLocation: '2d' });
module.exports = mongoose.model('customer', customerSchema);
