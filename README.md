# mutent

[![npm version](https://badge.fury.io/js/mutent.svg)](https://badge.fury.io/js/mutent)
[![Dependencies Status](https://david-dm.org/greguz/mutent.svg)](https://david-dm.org/greguz/mutent.svg)
[![Actions Status](https://github.com/greguz/mutent/workflows/ci/badge.svg)](https://github.com/greguz/mutent/actions)
[![Coverage Status](https://coveralls.io/repos/github/greguz/mutent/badge.svg?branch=master)](https://coveralls.io/github/greguz/mutent?branch=master)

While working with a database, It's common to write a lot of code to interact with the retrieved data. It's also common to write some specific queries (both to read and write) to interact with the database. When a project reaches a medium size, It's easy to spot more than one way to do the same thing: one that leverages to the programming language features, and another one that uses the database capabilities.

Mutent provides a generalized method to interact with external data sources, plus make It possible to define all mutations as ordinary functions.

## Installation

```
npm install --save mutent
```

## ESNext

This project uses **ES2018** syntax (Node.js >= 10). If you need to run Mutent on an older runtime, a transpilation with tools like [Babel](https://babeljs.io/) is required.

## Example

```javascript
import { createStore } from 'mutent'
import { createArrayAdapter } from 'mutent-array'

const database = []

const store = createStore({
  name: 'MyStore',
  adapter: createArrayAdapter(database)
})

let counter = 0

async function foo() {
  // create one
  const dexter = await store
    .create({
      id: counter++,
      name: 'Dexter'
    })
    .unwrap()
  console.log(dexter) // { id: 0, name: "Dexter" }

  // create many
  const family = await store
    .create([
      { id: counter++, name: 'Dee Dee' },
      { id: counter++, name: 'Mom' },
      { id: counter++, name: 'Dad' }
    ])
    .unwrap()
  console.log(family) // [{ id: 1, name: "Dee Dee" }, { id: 2, name: "Mom" }, { id: 3, name: "Dad" }]

  // find one
  const nope = await store.find(item => item.name === 'Monkey').unwrap()
  console.log(nope) // null

  try {
    // read one (required)
    const mandark = await store.read(item => item.name === 'Mandark').unwrap()
  } catch (err) {
    // catch "mandark does not exist"
    if (err.code === 'EMUT_NOT_FOUND') {
      const mandark = await store
        .create({ id: counter++, name: 'Mandark' })
        .unwrap()
      console.log(mandark) // { id: 5, name: "Mandark" }
    } else {
      throw err
    }
  }

  // delete one
  const deadMandark = await store
    .read(item => item.name === 'Mandark')
    .delete()
    .unwrap()
  console.log(deadMandark) // { id: 5, name: "Mandark" }

  // find many
  const protagonists = await store.filter(item => item.id <= 1).unwrap()
  console.log(protagonists) // [{ id: 0, name: "Dexter" }, { id: 1, name: "Dee Dee" }]

  // update many
  const updatedProtagonists = await store
    .filter(item => item.id <= 1)
    .update(item => ({ ...item, protagonist: true }))
    .unwrap()
  console.log(updatedProtagonists) // [{ id: 0, name: "Dexter", protagonist: true }, { id: 1, name: "Dee Dee", protagonist: true }]
}

foo().catch(err => console.error(err))
```
