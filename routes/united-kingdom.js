var async = require('async'),
    express = require('express'),
    router = express.Router(),
    Location = require('../models/location'),
    locationSlugger = require('location-slugger');

router.get('/', function(req, res) {

    Location.find().distinct('country', function(error, dbCountries) {

        var includeCounties = req.query.includeCounties,
            includeTowns = req.query.includeTowns;

        var countries = [];

        dbCountries.forEach(function(country) {
            countries.push({
                name: country,
                slug: locationSlugger.slug(country)
            });
        });

        if (includeCounties && includeCounties > 0) {
            addCountiesToCountries(countries, includeCounties, function(err, countriesWithCounties) {
                if (includeTowns && includeTowns > 0) {
                    addTownsToCountriesCounties(countriesWithCounties, includeTowns, function(err, countriesWithCountiesAndTowns) {
                        res.json(countriesWithCountiesAndTowns);
                    });
                } else {
                    return res.json(countriesWithCounties);
                }
            });
        } else {
            return res.json(countries);
        }

    });
});

router.get('/:country', function(req, res) {

    var includeCounties = req.params.includeCounties,
        includeTowns = req.params.includeTowns;

    Location.find({ countrySlug: req.params.country }, function(err, dbCountries) {

        var countries = dbCountries.map(function(county) {
            return {
                name: county.name,
                nameSlug: county.nameSlug,
            }
        });

        if (includeCounties && includeCounties > 0) {
            countries.forEach(function(country) {
                country.child_locations = [{
                    name: 'x',
                    nameSlug: 'xx'
                }]
            });
        }

        res.json(countries);
    });
});

router.get('/:country/:county', function(req, res) {
    Location.find({
        countrySlug: req.params.country,
        countySlug: req.params.county
    }, function(err, towns) {
        var result = towns.map(function(town) {
            return {
                name: town.name,
                nameSlug: town.nameSlug,
            }
        });

        res.json(result);
    });
});

function addCountiesToCountries(countries, numberOfCounties, done) {

    async.forEach(countries, function(country, cb) {

        Location.aggregate([
            { $match: { countrySlug: country.slug } },
            { $group: { _id: { name: '$county', slug: '$countySlug' } } },
            { $project: { _id: 0, name: '$_id.name', slug: '$_id.slug' } },
            { $sort: { county: 1 } },
            { $limit: parseInt(numberOfCounties) },
        ], function(err, results) {

            country.child_locations = results;
            cb();
        })

    }, function(err) {
        return done(err, countries)
    })
}

function addTownsToCountriesCounties(countries, numberOfCounties, done) {

    async.forEach(countries, function(country, cb) {

        async.forEach(country.child_locations, function(county, cb) {

            Location.aggregate([
                { $match: { countrySlug: country.slug, countySlug: county.slug } },
                { $sort: { name: -1 } },
                { $group: { _id: { name: '$name', slug: '$nameSlug' } } },
                { $project: { _id: 0, name: '$_id.name', slug: '$_id.slug' } },
                { $limit: parseInt(numberOfCounties) },
            ], function(err, results) {
                county.child_locations = results;
                cb();
            })

        }, function(err) {
            return done(err, countries)
        });
    });
}

module.exports = router;
