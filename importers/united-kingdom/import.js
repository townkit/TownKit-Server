var _ = require('lodash'),
    async = require('async'),
    csv = require('fast-csv'),
    fs = require('fs'),
    log = require('single-line-log').stdout,
    locationSlugger = require('location-slugger'),
    Location = require(__dirname + '/../../models/location'),
    CachedResponse = require(__dirname + '/../../models/cachedResponse');

module.exports.import = function(fileName, done) {

    var self = this;

    self.mapLondonBoroughs = [];
    self.mapCountries = [];
    self.mapCounties = [];
    self.countTowns = 0;

    self.unitedKingdom = null;

    parseCsv(fileName, function(data) {

        async.series([
                function(next) {
                    console.log('Clearing United Kingdom...')

                    Location.findOne({name: 'United Kingdom'}, function(err, unitedKingdom){
                        if(unitedKingdom){
                            Location.remove({$or:[{path: {$regex : unitedKingdom._id}}, {_id: unitedKingdom._id}]}, function(err){
                                console.log('United Kingdom cleared')
                                next();
                            })
                        }
                        else{
                            next();
                        }
                    })
                },

                function(next) {
                    callbackErrorHandler(function() {
                        console.log('Creating United Kingdom')

                        self.unitedKingdom = new Location({
                            name: 'United Kingdom',
                            slugs: [
                                locationSlugger.slug('United Kingdom')
                            ]
                        });

                        self.unitedKingdom.save(next);
                    }, next);
                },

                function(next) {
                    callbackErrorHandler(function() {
                    
                        console.log('Creating Countries')

                        var countries = generateCountryNames(data);

                        async.each(countries, function(country, callback) {
                            self.unitedKingdom.appendChild(country);
                            self.mapCountries[country.name] = country;
                            country.save(callback);
                        }, next);

                    }, next);
                },

                function(next) {
                    callbackErrorHandler(function() {
                    
                        console.log('Creating London')

                        var london = new Location({
                            name: 'London',
                            slugs: [
                                locationSlugger.slug('London'),
                                locationSlugger.slug('London, England, United Kingdom')
                            ]
                        });

                        var england = self.mapCountries['England'];
                        england.appendChild(london);

                        london.save(function(err) {
                            console.log('Creating London Boroughs and Counties')
                            generateLondonBoroughs(data, london, next);
                        });
                    }, next);
                },

                function(next) {
                    callbackErrorHandler(function() {
                        
                        console.log('Creating Towns')
                        var arrDataToSave = [];

                        for (var i = 0; i < data.length; i++) {
                            var rowData = data[i];
                            self.countTowns++;

                            if (rowData.nuts_region == 'London') { //If it's london
                                var londonBoroughs = rowData.county;

                                var londonBoroughName = rowData.local_government_area;

                                var londonBorough = self.mapLondonBoroughs[londonBoroughName];

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
                                var county = self.mapCounties[rowData.county];

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
                                console.log("Error:");
                                console.log(err);
                            }
                            next(err);
                        });
                    }, next);
                },

                function(next) {
                    console.log("Data Rows: " + data.length);
                    console.log("Towns Processed: " + self.countTowns);
                    self.mapCountries = [];
                    self.mapLondonBoroughs = null;
                    self.mapCounties = null;
                    console.log('Completed!')
                    next();
                },

                function(next) {
                    console.log('Clearing Cached Responses...')
                    CachedResponse.remove({}, next)
                },

                function(next) {
                    callbackErrorHandler(function() {
                        console.log('Deleting source file...')
                        fs.unlink(fileName, next);
                    }, next);
                }
            ],

            function(err) {
                if(!err)
                    console.log('Done')
                
                done(err, self.countTowns);
            });
    });

function callbackErrorHandler(fn, callback) {
  try {
    fn()
  } catch (err) {
    callback(err);
  }
}



    function parseCsv(fileName, callback) {

        var locationRows = [];

        csv
            .fromPath(fileName, {
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

    function generateLondonBoroughs(sourceData, london, next) {

        var arrToSave = [];

        try {
            for (var i = 0; i < sourceData.length; i++) {
                var rowData = sourceData[i];
                if (rowData.nuts_region == 'London') {
                    var londonBoroughName = rowData.local_government_area;
                    if (!self.mapLondonBoroughs[londonBoroughName]) {
                        var londonBorough = new Location({
                            name: londonBoroughName,
                            slugs: [
                                locationSlugger.slug(londonBoroughName),
                                locationSlugger.slug(londonBoroughName + ', London, England, United Kingdom'),
                            ]
                        });

                        london.appendChild(londonBorough);

                        self.mapLondonBoroughs[londonBorough.name] = londonBorough;

                        arrToSave.push(londonBorough);
                    }
                } else {
                    if (!self.mapCounties[rowData.county]) {
                        var country = self.mapCountries[rowData.country];
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

                        self.mapCounties[rowData.county] = county;
                        
                        arrToSave.push(county);
                    }
                }
            }
        } catch (err) {
            console.log("Unknown Error: ", err);
            console.log(err);
            return next(err);
        }
        async.each(arrToSave, function(dataToSave, callback) {

            dataToSave.save(function(err, obj) {
                if (err) {
                    console.log("Error!!" ,err);
                }
                callback();
            });

        }, next)
    }
}