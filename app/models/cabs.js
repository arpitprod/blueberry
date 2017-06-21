var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var cabSchema = new Schema({
	driverId: String,
	isPink: Boolean,
	available: Boolean,
	cabLocation: [Number],
	distance: String
});
cabSchema.index({ cabLocation: '2d' });
module.exports = mongoose.model('cabs', cabSchema);

