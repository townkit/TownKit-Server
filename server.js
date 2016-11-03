var app = require('./app.js'),
	argv = require('optimist').argv,
    mongoose = require('mongoose');

if (argv.import == 'true') {
    require('./importers')(function() {
        startApp();
    })
}
else{
    mongoose.connect('mongodb://localhost/townie');
	startApp();
}

function startApp() {
    var port = process.env.PORT || 8080; // set our port
    app.listen(port);

    console.log('Running on port ' + port);
}
