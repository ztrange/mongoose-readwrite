import mongoose from 'mongoose'
import protect from '../src'


const Friend = mongoose.Schema({
  name: {
    first: String,
    last: String,
  },
  secret: String,
})
Friend.plugin(protect, {
  rules: {
    name: {
      first: { writable: false },
      last: { writable: true },
    },
    secret: { readable: ['Admin'] },
  },
})

const CharacterSchema = mongoose.Schema({
  weight: Number,
  height: Number,
  name: {
    first: String,
    last: String,
  },
  alias: String,
  secret: String,
  friends: {
    type: [Friend],
    writable: false,
  },
})
CharacterSchema.plugin(protect, {
  rules: {
    weight: { writable: true },
    height: { writable: false },
    name: {
      first: { writable: true },
      last: { writable: false },
    },
    alias: {
      writable: 'Admin'.split(' '),
    },
    secret: { readable: false },
  },
})
const Character = mongoose.model('Character', CharacterSchema)


const filterCharacter = Character.getInputFilter()
const filterFriend = Character.getInputFilter({ subdocument: 'friends' })


test('getInputFilter to forbid _id', () => {
  const filtered = filterCharacter({
    _id: mongoose.Types.ObjectId().toString(),
  })

  expect(filtered).not.toMatchObject({
    _id: expect.anything(),
  })
})


test('getInputFilter to filter simple properties', () => {
  const filtered = filterCharacter({
    weight: 40,
    height: 122,
  })

  expect(filtered).toMatchObject({
    weight: 40,
  })

  expect(filtered).not.toMatchObject({
    height: expect.anything(),
  })
})


test('getInputFilter to filter nested properties', () => {
  const filtered = filterCharacter({
    name: {
      first: 'Frodo',
      last: 'Baggins',
    },
  })

  expect(filtered).toMatchObject({
    'name.first': 'Frodo',
  })

  expect(filtered).not.toMatchObject({
    'name.last': expect.anything(),
  })
})


test('getInputFilter to filter simple properties by persona', () => {
  const filteredSomeone = filterCharacter({
    alias: 'ring bearer',
  }, 'Someone')

  const filteredAdmin = filterCharacter({
    alias: 'ring bearer',
  }, 'Admin')

  expect(filteredSomeone).not.toMatchObject({
    alias: expect.anything(),
  })

  expect(filteredAdmin).toMatchObject({
    alias: 'ring bearer',
  })
})


test('getInputFilter to filter nested document nested properties', () => {
  const filtered = filterFriend({
    name: {
      first: 'Samwise',
      last: 'Gamgee',
    },
  })

  expect(filtered).toMatchObject({
    'name.last': 'Gamgee',
  })

  expect(filtered).not.toMatchObject({
    'name.first': expect.anything(),
  })
})


test('redact non readable properties', () => {
  const frodo = new Character({
    name: {
      first: 'Frodo',
      last: 'Baggins',
    },
    secret: 'has a ring',
    friends: [{
      name: {
        first: 'Samwise',
        last: 'Gamgee',
      },
      secret: 'loves Frodo',
    }],
  })

  const obj = frodo.redact()
  const sam = obj.friends.pop()


  expect(obj).not.toMatchObject({
    secret: expect.anything(),
  })

  expect(sam).not.toMatchObject({
    secret: expect.anything(),
  })
})


test('allow Admin to read property readable by persona', () => {
  const frodo = new Character({
    name: {
      first: 'Frodo',
      last: 'Baggins',
    },
    secret: 'has a ring',
    friends: [{
      name: {
        first: 'Samwise',
        last: 'Gamgee',
      },
      secret: 'loves Frodo',
    }],
  })

  const obj = frodo.redact({ persona: 'Admin' })
  const sam = obj.friends.pop()


  expect(obj).not.toMatchObject({
    secret: expect.anything(),
  })

  expect(sam).toMatchObject({
    secret: expect.anything(),
  })
})

const BankAccountSchema = mongoose.Schema({
  name: String,
  number: String,
  key: String,
})
BankAccountSchema.plugin(protect, {
  options: {
    defaults: {
      readable: false,
      writable: false,
    },
  },
  rules: {
    name: { readable: true },
  },
})
const BankAccount = mongoose.model('BankAccount', BankAccountSchema)

test('redact non readable properties with default readable false', () => {
  const account = new BankAccount({
    name: 'savings',
    number: '4555-5555-5555-5555',
    key: '1234',
  })

  const obj = account.redact()

  expect(obj).toMatchObject({
    name: 'savings',
  })

  expect(obj).not.toMatchObject({
    number: expect.anything(),
  })
})
