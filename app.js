var express = require('express'),
    multer  = require('multer'),
    upload = multer(),
	app = express();

var router = express.Router();

app.get('/favicon.ico', function(req, res) {
    res.status(200);
});

app.set('view engine', 'pug')
app.use('/import', require('./routes/import'));
app.use('/', require('./routes/locations'));

module.exports = app;