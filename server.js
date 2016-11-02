var app = require('./app.js');
var mongoose   = require('mongoose');
mongoose.connect('mongodb://localhost/townie');

var port = process.env.PORT || 8080;        // set our port
app.listen(port);

console.log('Running on port ' + port);