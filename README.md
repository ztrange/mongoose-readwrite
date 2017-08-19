# mongoose-readwrite

Remove unauthorized properties from inputs and outputs. Easily protect your input and redact your outputs without fuss.

## Installation
```bash
npm install --save mongoose-readwrite
```

## Usage
### Import
#### ES5
```js
var readwrite = require('mongoose-readwrite').default
```

#### ES2015+
```js
import readwrite from 'mongoose-readwrite'
```

### Basic setup

```js
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

// ...
// Compile your model
const User = mongoose.model('User', UserSchema)
```

### Basic input filtering
```js
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

```

### Basic output filtering
```js
// Get a mongoose document, you can also get if from a query
const Harry = new User({
  name: 'Rowan',
  email: 'real@email.com',
  password: 'realpassword',
})


// Call redact on the object and obtain a safe output with all non-readable properties removed
console.log(Harry.redact()) // { name: 'Rowan', email: 'real@email.com' }
```

For more usage cases, check the [examples](https://github.com/ztrange/mongoose-readwrite/tree/master/examples) and [tests](https://github.com/ztrange/mongoose-readwrite/tree/master/test)


## API Reference
### Setup
```js
UserSchema.plugin(readwrite, {
  /*
  The rules object is parallel to the Schema definition object.
  For each SchemaType defined on the Schema, the rules object can contain
  an object with rules for the path. The allowed rules are readable and writable
  All rules accept a Boolean or [String] value.
  The boolean value applies to all filter and redact operations.
  An empty array equals to false.
  If an array of strings is passed, each string value will be treated as a persona
  for filter and redact operations.
  */
  rules: {
    /*
    Rules accept Boolean or [String].
    */
    readable: Boolean || [String]
    writable: Boolean || [String]
  },
})
```

### getInputFilter
```js
/**
  * Returns an input filter function
  * @param {object} [options] - Options object for filter creation
  * @param {object} [options.subdocument] - The dot path of a subdocument on the parent schema e.g. 'socialInfo.friends'
  */
const filter = User.getInputFilter(options)
```

### apply filter
```js
/**
  * Returns filtered data
  * @param {object} data - Data object to be filtered
  * @param {object} [persona] - represents a role that has certain write permissions
according to the rules defined on setup. e.g. 'Admin'
If persona is undefined, a field is writable or readable if the rule is not
present (the field is not restricted) or if the rule has a value of true.
  */
const filteredData = filter(data, persona)
```

## License

(The MIT License)

Copyright (c) 2017 Mario Ferreira &lt;ztrange@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Changelog

**1.0.0**
 * Initial commit

**2.0.0-2.0.4**
 * Refactor and tests
 * Documentation on README
 * Examples
