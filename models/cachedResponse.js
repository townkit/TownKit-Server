var db = require('../db.js'),
	Schema = db.Schema

var cachedLocationSchema = new Schema({
	cacheKey: String,
	location: Object
}, { strict: false });

db.Promise = global.Promise
module.exports = db.model('cachedLocation', cachedLocationSchema);