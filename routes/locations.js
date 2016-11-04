var async = require('async'),
    express = require('express'),
    router = express.Router(),
    Location = require('../models/location'),
    locationSlugger = require('location-slugger');

router.get('/*', function(req, res) {
    var params = req.params[0].replace(/\/$/, '');
    var slug = params.split('/').reverse().join('--');

    console.log(req.query);
    slug = "^" + slug;

    //case insensitive search
    var searchObject = (slug.indexOf('--') > 0)
        ? { 'slugs.1': { $regex : new RegExp(slug, 'i') } }
        : { 'slugs.0': { $regex : new RegExp(slug, 'i') } };

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
        if(!depthLimits)
        {
            depthLimits=["*"];
        }
        console.log(depthLimits);

        //this is where things start to get difficults
        var parentLocation = locationsForSlug[0].toObject();
        var locationObject = {
            _id: parentLocation._id,
            name: parentLocation.name,
            slugs: parentLocation.slugs
        };
        //parentLocation.child_locations=[];
        //here we need to identify how deep to do the recursive look up, then populate
        //the response json
        generateChildLocationsForLocation(locationObject, depthLimits,0, function(location) {
            return res.json(location);
            //if(location.child_locations)
            //{
            //    return res.json(location.child_locations);
            //}
            //else
            //{
            //    return res.json([]);
            //}
        });
    });
});

//this is my rubbish attempt at doing the recursion - it's not working at all.
//please do not use this!
//I have used this recursive methods for now.
// Seems to be easy way at the moment
function generateChildLocationsForLocation(location, depthLimits, curDepths, callback) {

    Location.find({ parentId: location._id }).sort({ name: 1 }).limit(depthLimits[curDepths]).exec(function(err, childLocations) {
        delete location._id;
        if(err)
        {
            console.log(err);
        }
        if(childLocations && childLocations.length>0)
        {
            console.log("Child Length:"+childLocations.length);

            if(depthLimits.length > curDepths+1)
            {
                location.child_locations = childLocations.map(function(o) {
                    return {
                        _id: o._id,
                        name: o.name,
                        slugs: o.slugs
                    }
                });
                location.child_locations.push("last");
                async.eachSeries(location.child_locations, function(childLocation, callback1) {
                    if(childLocation=="last")
                    {
                        location.child_locations.pop();
                        console.log("Last one called.:");

                        if(curDepths==0)
                        {
                            return callback(location);
                        }
                        else
                        {
                            return callback(null,location);
                        }
                    }
                    else
                    {
                        console.log("Call Recursive.:");
                        generateChildLocationsForLocation(childLocation, depthLimits,curDepths + 1, callback1)
                    }
                })
            }
            else {
                console.log("Depth rechead.:");
                location.child_locations = childLocations.map(function(o) {
                    return {
                        name: o.name,
                        slugs: o.slugs
                    }
                });

                if(curDepths==0)
                {
                    return callback(location);
                }
                else
                {
                    return callback(null,location);
                }
            }
        }
        else {
            console.log("Nothing found.:");
            if(curDepths==0)
            {
                return callback(location);
            }
            else
            {
                return callback(null,location);
            }
        }

    });
}

module.exports = router;