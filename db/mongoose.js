const mongoose = require('mongoose');

//Steal the promises from the node environmnent
mongoose.Promise = global.Promise;

//If there is an environment variable MONGODB_URI connect to that or connect to localhost
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bfy');

module.exports = {
  mongoose
};
