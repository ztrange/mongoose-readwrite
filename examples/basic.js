const mongoose  = require('mongoose')
const readwrite = require('mongoose-readwrite').default
// const readwrite = require('../dist').default

// Define your Schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
})

// Add mongoose-readwrite plugin and define rules on the SchemaTypes
UserSchema.plugin(readwrite, {
  rules: {
    email: {
      writable: false,
    },
    password: {
      readable: false,
      writable: false,
    },
  },
})


const User = mongoose.model('User', UserSchema)

// Create a filter
const filterInput = User.getInputFilter()

// Pass an object (for example the request body) to the filter
const filteredBody = filterInput({
  name: 'Harry',
  email: 'bogus@email.com',
  password: 'fakepassword',
})

// The result removes any unauthorized property from the input
console.log(filteredBody) // { name: 'Harry' }


// Get a mongoose document of a Model with mongoose-readwrite
const Harry = new User({
  name: 'Rowan',
  email: 'real@email.com',
  password: 'realpassword',
})


// Call redact on the object and obtain a safe output with all non-readable properties removed
console.log(Harry.redact()) // { name: 'Rowan', email: 'real@email.com' }

