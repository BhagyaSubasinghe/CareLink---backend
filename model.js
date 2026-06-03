const mongose = require('mongoose');
const schema = mongose.Schema;

const userSchema = new schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
});

const User = mongose.model('User', userSchema); 
module.exports = User;