var mongoose=require('mongoose');

mongoose.connect(process.env.MONGO_URL);

mongoose.connection.on('connected', function () {  
  console.log('Mongoose connected');
}); 

module.exports = mongoose