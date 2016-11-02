var async = require('async'),
	csv = require('fast-csv'),
	locationSlugger = require('location-slugger'),
	Location = require(__dirname+'/../models/Location'),
	mongoose = require('mongoose');

parseCsv(function(data){

	mongoose.connect('mongodb://localhost/townie');

	async.forEach(data, function(item, callback){
		item.save(callback)
	}, function(err){
		console.log('Done')
		process.exit();
	});
	
});

function parseCsv(callback){

	var dataArray = [];

	csv
	.fromPath('data.csv', {headers: true})
	.on('data', function(data){
		var location = new Location({
			name: data.name,
			nameSlug: locationSlugger.slug(data.name),

			county: data.county,
			countySlug: locationSlugger.slug(data.county),

			country: data.country,
			countrySlug: locationSlugger.slug(data.country),

			latitude: data.latitude,
			longitude: data.longitude,

			type: data.type,
		});

		dataArray.push(location);
	})
	.on('end', function(){
		return callback(dataArray);
	});
}