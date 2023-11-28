# Mutent

[![npm](https://img.shields.io/npm/v/mutent)](https://www.npmjs.com/package/mutent)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/mutent)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Actions Status](https://github.com/greguz/mutent/workflows/ci/badge.svg)](https://github.com/greguz/mutent/actions)
[![Coverage Status](https://coveralls.io/repos/github/greguz/mutent/badge.svg?branch=master)](https://coveralls.io/github/greguz/mutent?branch=master)
![GitHub](https://img.shields.io/github/license/greguz/mutent)

Mutent is an agnostic solution to work with any Datastore.

## Features

- **Zero dependencies**: small footprint.
- **Pure ES2018 code**: any environment that can run ES2018 code can directly include this module. Downgrading with tools like [Babel](https://babeljs.io/) is still possible.
- **Extensible**: a powerful hooks system in place.
- **Agnostic**: can be configured to work with any Datastore through Adapters.
- **TypeScript**: type declarations are included.
- **ESM**: support native ESM.
- **CommonJS**: support old Node.js runtimes (`require`).
- **Well tested**: code coverage above 95%.

## Installation

```
npm install --save mutent
```

## Documentation

Start from the [Quickstart](https://greguz.github.io/mutent/) section.

## Example

```javascript
import { Store } from 'mutent'

// Define simple array adapter (persist entities inside the array)
class ArrayAdapter {
  constructor(array = []) {
    this.array = array
  }

  find(predicate) {
    return this.array.find(predicate)
  }

  filter(predicate) {
    return this.array.filter(predicate)
  }

  create(data) {
    this.array.push(data)
  }

  update(oldData, newData) {
    this.array.splice(
      this.array.findIndex(entity => entity === oldData),
      1,
      newData
    )
  }

  delete(data) {
    this.array.splice(
      this.array.findIndex(entity => entity === data),
      1
    )
  }
}

async function foo() {
  // Our "datastore"
  const database = []

  // Create mutent store
  const store = new Store({
    adapter: new ArrayAdapter(database)
  })

  // Create a new entity
  const dexter = await store
    .create({
      name: 'Dexter',
      protagonist: true
    })
    .unwrap()
  console.log(dexter) // Dexter
  console.log(database) // Dexter

  // Create multiple entities
  const family = await store
    .create([
      {
        name: 'Dee Dee',
        protagonist: true
      },
      { name: 'Mom' },
      { name: 'Dad' }
    ])
    .unwrap()
  console.log(family) // Dee Dee, Mom, Dad
  console.log(database) // Dexter, Dee Dee, Mom, Dad

  // Find one entity
  const firstProtagonist = await store
    .find(entity => entity.protagonist) // Declare adapter query
    .unwrap()
  console.log(firstProtagonist) // Dexter

  // Filter entities
  const allProtagonists = await store
    .filter(entity => entity.protagonist) // Declare adapter query
    .unwrap()
  console.log(allProtagonists) // Dexter, Dee Dee

  // Update
  const newDexter = await store
    .find(entity => entity.name === 'Dexter') // Declare adapter query
    .update(entity => ({ ...entity, surname: 'McPherson' })) // Declare entity mutation
    .unwrap()
  console.log(newDexter) // Dexter McPherson
  console.log(database) // Dexter McPherson, Dee Dee, Mom, Dad

  // Assign (update)
  const newDeeDee = await store
    .find(entity => entity.name === 'Dee Dee') // Declare adapter query
    .assign({ surname: 'McPherson' }) // Update with Object.assign()
    .unwrap()
  console.log(newDeeDee) // Dee Dee McPherson
  console.log(database) // Dexter McPherson, Dee Dee McPherson, Mom, Dad

  // Delete entities
  const deletedParents = await store
    .filter(entity => !entity.protagonist) // Declare adapter query
    .delete() // Tell mutent we want to delete matching entities
    .unwrap()
  console.log(deletedParents) // Mom, Dad
  console.log(database) // Dexter, Dee Dee
}

foo().catch(err => console.error(err))
```
