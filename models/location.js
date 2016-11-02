var mongoose = require('mongoose'),
	Schema = mongoose.Schema

var locationSchema = new Schema( {

	name: String,
	nameSlug: String,

	county: String,
	countySlug: String,

	country: String,
	countrySlug: String,

	latitude: String,
	longitude: String,

	type: String,
});

mongoose.Promise = global.Promise
var Location = mongoose.model('location', locationSchema);

module.exports = Location;
