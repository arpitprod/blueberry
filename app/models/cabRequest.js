var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var cabRequestSchema = new Schema({
	driverId: String,
	userId: String,
	tripId: String,
	isPink: Boolean,
	fromLocation: [Number],
	toLocation: [Number],
	startTime: Date,
	endTime: Date,
	requestTime: Date,
	updated_at: Date,
	acceptByDriver: Boolean,
	success: Boolean,
	distance: String,
	message: String,
	timeElapsed: String,
	tripFare: Number,
	pinkCharge: Number
});
// cabRequestSchema.index({ location: '2d' });
module.exports = mongoose.model('cabsRequest', cabRequestSchema);

