var config = require('config'),
	mongoose=require('mongoose');

mongoose.connect(config.mongoUrl);

mongoose.connection.on('connected', function () {  
  console.log('Mongoose connected');
}); 

mongoose.connection.on('error', function (err) {  
  console.log('Mongoose connection error: ', err);
}); 

module.exports = mongoose