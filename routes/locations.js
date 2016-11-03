var async = require('async'),
    express = require('express'),
    router = express.Router(),
    Location = require('../models/location'),
    locationSlugger = require('location-slugger');

router.get('/*', function(req, res) {

    var params = req.params[0].replace(/\/$/, '');
    var slug = params.split('/').reverse().join('--');

    console.log(req.query);

    var searchObject = (slug.indexOf('--') > 0) ? { 'slugs.1': slug } : { 'slugs.0': slug };

    Location.find(searchObject, function(err, locationsForSlug) {

        if (!locationsForSlug || locationsForSlug.length == 0) {
            //alex todo: nicer error
            return res.status(404)
                .send('Location Not found');
        }
        //alex todo: if more than one location for slug

        //the depth limits for the query
        //this will denote how many recursive lookups for child locations we do
        //and how many from each level we select.
        var depthLimits = req.query.limit;

        //this is where things start to get difficults
        var parentLocation = locationsForSlug[0];


        //here we need to identify how deep to do the recursive look up, then populate
        //the response json
        
        generateChildLocationsForLocation(parentLocation, 500, function(location) {

            return res.json(location);
        });


    });
});

//this is my rubbish attempt at doing the recursion - it's not working at all.
//please do not use this! 
function generateChildLocationsForLocation(location, limit, callback) {

    depth = 1;

    var locationObject = {
        _id: location._id,
        name: location.name,
        child_locations: []
    };

    Location.find({ parentId: location._id }).sort({ name: 1 }).limit(limit).exec(function(err, childLocations) {

        locationObject.child_locations = childLocations.map(function(o) {
            return {
                _id: o._id,
                name: o.name,
                slugs: o.slugs
            }
        });

        async.each(childLocations, function(childLocation, callback) {
            generateChildLocationsForLocation(childLocation, 5, callback)
        })


        return callback(locationObject);
    });
}

module.exports = router;