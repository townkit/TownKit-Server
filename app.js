var express = require('express'),
	app = express();

var router = express.Router();

app.use('/United-Kingdom', require('./routes/united-kingdom'));

module.exports = app;