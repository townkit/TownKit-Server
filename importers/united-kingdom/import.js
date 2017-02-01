var _ = require('lodash'),
    async = require('async'),
    csv = require('fast-csv'),
    log = require('single-line-log').stdout,
    locationSlugger = require('location-slugger'),
    Location = require(__dirname + '/../../models/location'),
    CachedResponse = require(__dirname + '/../../models/cachedResponse');

var unitedKingdom;
var mapCountries = [];
var london;
var mapLondonBoroughs = [];

var mapCounties = [];
var countTowns = 0;

module.exports.import = function(done) {

    parseCsv(function(data) {

        async.series([

                function(next) {
                    console.log('Clearing Locations...')
                    Location.remove({}, next)
                },

                function(next) {
                    console.log('Creating United Kingdom')

                    unitedKingdom = new Location({
                        name: 'United Kingdom',
                        slugs: [
                            locationSlugger.slug('United Kingdom')
                        ]
                    });

                    unitedKingdom.save(next);
                },

                function(next) {
                    console.log('Creating Countries')

                    var countries = generateCountryNames(data);
                    async.each(countries, function(country, callback) {
                        unitedKingdom.appendChild(country);
                        mapCountries[country.name] = country;
                        country.save(callback);
                    }, next)

                },

                function(next) {
                    console.log('Creating London')

                    london = new Location({
                        name: 'London',
                        slugs: [
                            locationSlugger.slug('London'),
                            locationSlugger.slug('London, England, United Kingdom')
                        ]
                    });

                    var england = mapCountries['England'];
                    england.appendChild(london);

                    london.save(function(err) {
                        console.log('Creating London Boroughs and Counties')
                        generateLondonBoroughAndCounty(data, next);
                    });
                },

                function(next) {
                    console.log('Creating Towns')

                    var arrDataToSave = [];

                    for (var i = 0; i < data.length; i++) {
                        var rowData = data[i];
                        countTowns++;

                        if (rowData.nuts_region == 'London') { //If it's london
                            var londonBoroughs = rowData.county;

                            var londonBoroughName = rowData.local_government_area;

                            var londonBorough = mapLondonBoroughs[londonBoroughName];

                            var townInLondonBorough = {
                                name: rowData.name,
                                slugs: [
                                    locationSlugger.slug(rowData.name),
                                    locationSlugger.slug(rowData.name + ', ' + londonBoroughName + ', London' + ', England, United Kingdom'),
                                ],
                                parentId: londonBorough._id,
                                path: "," + londonBorough._id + londonBorough.path
                            };
                            arrDataToSave.push(townInLondonBorough);
                        } else {
                            var county = mapCounties[rowData.county];

                            var town = {
                                name: rowData.name,
                                slugs: [
                                    locationSlugger.slug(rowData.name),
                                    locationSlugger.slug(rowData.name + ', ' + rowData.county + ', ' + rowData.country + ', United Kingdom')
                                ],
                                parentId: county._id,
                                path: "," + county._id + county.path
                            };
                            arrDataToSave.push(town);
                        }
                    }

                    console.log("Ready to save data: ", arrDataToSave.length);

                    Location.collection.insertMany(arrDataToSave, function(err) {
                        if (err) {
                            console.log("Error!");
                            console.log(err);
                        }
                        next();
                    });
                },

                function(next) {
                    console.log("Data Rows: " + data.length);
                    console.log("Towns Processed: " + countTowns);
                    unitedKingdom = null;
                    mapCountries = [];
                    london = null;
                    mapLondonBoroughs = null;
                    mapCounties = null;
                    console.log('Completed!')
                    next();
                },

                function(next) {
                    console.log('Clearing Cached Responses...')
                    CachedResponse.remove({}, next)
                }
            ],

            function(err, results) {

                if (err)
                    console.log('Error: ', err)

                done();
            });
    });

}

function parseCsv(callback) {

    var locationRows = [];

    csv
        .fromPath(__dirname + '/data.csv', {
            headers: true
        })
        .on('data', function(data) {
            var location = {
                name: data.name,
                county: data.county,
                country: data.country,
                latitude: data.latitude,
                longitude: data.longitude,
                local_government_area: data.local_government_area,
                nuts_region: data.nuts_region,
                type: data.type,
            };

            locationRows.push(location);
        })
        .on('end', function() {
            return callback(locationRows);
        });
}

function generateCountryNames(data) {
    var countryNames = _.uniq(_.map(data, function(d) {
        return d.country;
    }));

    var countries = _.map(countryNames, function(countryName) {
        return new Location({
            name: countryName,
            slugs: [
                locationSlugger.slug(countryName),
                locationSlugger.slug(countryName + ', United Kingdom')
            ]
        })
    })

    return countries;
}

function generateLondonBoroughAndCounty(data, next) {

    var arrToSave = [];

    try {

        for (var i = 0; i < data.length; i++) {
            var rowData = data[i];
            if (rowData.nuts_region == 'London') {
                var londonBoroughName = rowData.local_government_area;
                if (!mapLondonBoroughs[londonBoroughName]) {
                    var londonBorough = new Location({
                        name: londonBoroughName,
                        slugs: [
                            locationSlugger.slug(londonBoroughName),
                            locationSlugger.slug(londonBoroughName + ', London, England, United Kingdom'),
                        ]
                    });

                    if (london) {
                        london.appendChild(londonBorough);
                    } else {
                        console.log("London Does Not Exist!?");
                    }

                    mapLondonBoroughs[londonBorough.name] = londonBorough;

                    arrToSave.push(londonBorough);
                }
            } else {
                if (!mapCounties[rowData.county]) {
                    var country = mapCountries[rowData.country];
                    var county = new Location({
                        name: rowData.county,
                        slugs: [
                            locationSlugger.slug(rowData.county),
                            locationSlugger.slug(rowData.county + ', ' + country.name + ', United Kingdom')
                        ]
                    });
                    if (country) {
                        country.appendChild(county);
                    } else {
                        console.log("Country is not found");
                    }

                    mapCounties[rowData.county] = county;
                    
                    arrToSave.push(county);
                }
            }
        }
    } catch (err) {
        console.log("Unknown Error:");
        console.log(err);
    }

    try {
        async.each(arrToSave, function(dataToSave, callback) {

            dataToSave.save(function(err, obj) {
                if (err) {
                    console.log("Error!!" ,err);
                }
                callback();
            });

        }, next)
    } catch (err) {
        console.log(err);
    }
}
