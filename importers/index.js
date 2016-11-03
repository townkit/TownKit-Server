var mongoose = require('mongoose');

module.exports = function(done) {
    mongoose.connect('mongodb://localhost/townie');

    //we only have one at the moment
    require('./united-kingdom/import.js').import(function() {
        return done();
    })
}
