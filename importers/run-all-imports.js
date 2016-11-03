mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/townie');

require('./')(function() {

    console.log('Done');
    process.exit();
})
