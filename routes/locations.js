var async = require('async'),
    express = require('express'),
    router = express.Router(),
    Location = require('../models/location'),
    CachedResponse = require('../models/cachedResponse'),
    locationSlugger = require('location-slugger');

router.get('/*', function(req, res) {
    var params = req.params[0].replace(/\/$/, '');
    var slug = params.split('/').reverse().join('--');

    //the depth limits for the query
    //this will denote how many recursive lookups for child locations we do
    //and how many from each level we select.
    var depthLimits = req.query.limit;
    if (!depthLimits) {
        depthLimits = ["*"];
    }

    var cacheKey = slug + depthLimits.toString();

    async.waterfall([
        function(callback) {
            //check cache
            CachedResponse.findOne({ cacheKey: cacheKey }, function(err, cachedResponse) {
                if(cachedResponse){
                    return callback(err, cachedResponse.location);;
                }
                else{
                    return callback(err, null);;
                }
            });
        },
        function(location, callback) {

            if (location) {
                console.log('Found in cache, so not getting again')
                return callback(null, location)
            }

           console.log('Not found in cache, so getting and saving')

            slug = "^" + slug;

            //case insensitive search
            var searchObject = (slug.indexOf('--') > 0) ? { 'slugs.1': { $regex: new RegExp(slug, 'i') } } : { 'slugs.0': { $regex: new RegExp(slug, 'i') } };

            Location.find(searchObject, function(err, locationsForSlug) {

                if (!locationsForSlug || locationsForSlug.length == 0) {
                    //alex todo: nicer error
                    return res.status(404)
                        .send('Location Not found');
                }

                //alex todo: if more than one location for slug

                var parentLocation = locationsForSlug[0].toObject();

                var locationObject = {
                    _id: parentLocation._id,
                    name: parentLocation.name,
                    slugs: parentLocation.slugs
                };

                generateChildLocationsForLocation(locationObject, depthLimits, 0, function(location) {

                    console.log('Saving in cache')

                    var c = new CachedResponse({ cacheKey: cacheKey, location: location });

                    c.save(function() {
                        return callback(null, location);
                    })

                });
            })
        }

    ], function(err, location) {
        return res.json(location);
    });
});

function generateChildLocationsForLocation(location, depthLimits, curDepths, callback) {

    var limitCount = depthLimits[curDepths];
    var sortLimit = { sort: { name: 1 } };
    if (limitCount != "*") {
        sortLimit.limit = parseInt(limitCount);
    }

    Location.find({ parentId: location._id }, null, sortLimit).exec(function(err, childLocations) {
        delete location._id;
        if (err) {
            console.log(err);
        }
        if (childLocations && childLocations.length > 0) {

            if (depthLimits.length > curDepths + 1) {

                location.child_locations = childLocations.map(function(o) {
                    return {
                        _id: o._id,
                        name: o.name,
                        slugs: o.slugs
                    }
                });

                location.child_locations.push("last");

                async.eachSeries(location.child_locations, function(childLocation, callback1) {
                    
                    if (childLocation == "last") {
                        location.child_locations.pop();

                        if (curDepths == 0) {
                            return callback(location);
                        } else {
                            return callback(null, location);
                        }
                    } else {
                        generateChildLocationsForLocation(childLocation, depthLimits, curDepths + 1, callback1)
                    }
                })
            } else {
                location.child_locations = childLocations.map(function(o) {
                    return {
                        name: o.name,
                        slugs: o.slugs
                    }
                });

                if (curDepths == 0) {
                    return callback(location);
                } else {
                    return callback(null, location);
                }
            }
        } else {
            if (curDepths == 0) {
                return callback(location);
            } else {
                return callback(null, location);
            }
        }

    });
}

module.exports = router;
