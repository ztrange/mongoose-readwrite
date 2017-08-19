const mongoose  = require('mongoose')
const readwrite = require('mongoose-readwrite').default
// const readwrite = require('../dist').default

// Define your subdocument Schema
const PostSchema = new mongoose.Schema({
  title: String,
  body: String,
  publishedAt: Date,
})

// Add mongoose-readwrite plugin and define rules on the SchemaTypes
PostSchema.plugin(readwrite, {
  rules: {
    publishedAt: {
      writable: false,
      readable: true,
    },
  },
})


// Define your Schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  posts: [PostSchema],
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
    posts: {
      writable: false,
    },
  },
})


const User = mongoose.model('User', UserSchema)

// Create a filter for subdocuments
const filterPost = User.getInputFilter({ subdocument: 'posts' })

const filteredPost = filterPost({
  title: 'My real post',
  body: 'The post body goes here',
  publishedAt: new Date(),
})

// The result removes any unauthorized property from the input
console.log(filteredPost) // { title: 'My real post', body: 'The post body goes here' }

// Get a mongoose document of a Model with mongoose-readwrite
const Harry = new User({
  name: 'Rowan',
  email: 'real@email.com',
  password: 'realpassword',
  posts: [{
    title: 'The post',
    body: 'The post body',
    publishedAt: new Date(),
  }],
})


// Call redact on the object and obtain a safe output with all non-readable properties removed
// Any subdocument is automatically redacted if it has the mongoose-readwrite setup
console.log(Harry.redact()) // { name: 'Rowan', email: 'real@email.com', posts: [...]  }

