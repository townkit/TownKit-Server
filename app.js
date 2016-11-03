var express = require('express'),
	app = express();

var router = express.Router();

app.get('/favicon.ico', function(req, res) {
    res.status(200);
});

app.use('/', require('./routes/locations'));

module.exports = app;