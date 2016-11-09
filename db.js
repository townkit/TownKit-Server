var mongoose=require('mongoose');

mongoose.connect('mongodb://localhost/townie');

mongoose.connection.on('connected', function () {  
  console.log('Mongoose connected');
}); 

module.exports = mongoose