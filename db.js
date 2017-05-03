var config = require('config'),
	mongoose=require('mongoose');

mongoose.connect(config.mongoUrl);

mongoose.connection.on('connected', function () {  
  console.log('Connected to MongoDB');
}); 

mongoose.connection.on('error', function (err) {  
  console.log('Error connecting to MongoDB');
  console.log(err);
  process.exit();
}); 

module.exports = mongoose