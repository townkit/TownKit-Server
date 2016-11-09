var db = require('../db.js'),
	materializedPlugin = require('mongoose-materialized'),
	Schema = db.Schema

var locationSchema = new Schema( {
	name: String,
	slugs: Array
});

locationSchema.plugin(materializedPlugin);

db.Promise = global.Promise
module.exports = db.model('location', locationSchema);