var mongoose = require('mongoose'),
	Schema = mongoose.Schema

var cachedLocationSchema = new Schema({
	cacheKey: String,
	location: Object
}, { strict: false });

mongoose.Promise = global.Promise
module.exports = mongoose.model('cachedLocation', cachedLocationSchema);