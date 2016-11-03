var mongoose = require('mongoose'),
	materializedPlugin = require('mongoose-materialized'),
	Schema = mongoose.Schema

var locationSchema = new Schema( {
	name: String,
	slugs: Array
});

locationSchema.plugin(materializedPlugin);

mongoose.Promise = global.Promise
module.exports = mongoose.model('location', locationSchema);