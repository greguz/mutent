# mutent

[![npm version](https://badge.fury.io/js/mutent.svg)](https://badge.fury.io/js/mutent)
[![Dependencies Status](https://david-dm.org/greguz/mutent.svg)](https://david-dm.org/greguz/mutent.svg)
[![Actions Status](https://github.com/greguz/mutent/workflows/ci/badge.svg)](https://github.com/greguz/mutent/actions)
[![Coverage Status](https://coveralls.io/repos/github/greguz/mutent/badge.svg?branch=master)](https://coveralls.io/github/greguz/mutent?branch=master)

Mutent is an elegant and agnostic solution to work with any persistence layer.

Any action performed against the persistence layer is declared with plain JavaScript, making it possible to manipulate objects with just one language and leaving the integration stuff to the chosen adapter.

## Installation

```
npm install --save mutent
```

## ESNext

This project uses **ES2018** syntax (Node.js >= 10). If you need to run Mutent on an older runtime, a transpilation with tools like [Babel](https://babeljs.io/) is required.

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
  // Our "persistence" layer
  const database = []

  // Create mutent store
  const store = new Store({
    name: 'MyStore',
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
