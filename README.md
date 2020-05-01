# mutent

[![npm version](https://badge.fury.io/js/mutent.svg)](https://badge.fury.io/js/mutent)
[![Dependencies Status](https://david-dm.org/greguz/mutent.svg)](https://david-dm.org/greguz/mutent.svg)
[![Build Status](https://travis-ci.com/greguz/mutent.svg?branch=master)](https://travis-ci.com/greguz/mutent)
[![Coverage Status](https://coveralls.io/repos/github/greguz/mutent/badge.svg?branch=master)](https://coveralls.io/github/greguz/mutent?branch=master)

While writing large projects, It's common to find the need to manipulate data from external services. Those services normally define different kinds of communication methods. And those methods need to be implemented inside the codebase. Mutent is a tiny library that helps to break the mutation code from the integration code. It enables anyone to define mutations as normal JavaScript functions.

## Installation

```
npm install --save mutent
```

## Example

```javascript
const { createStore } = require('mutent')

function createReader (array, matcher) {
  return {
    find (query) {
      return array.find(item => matcher(item, query))
    },
    filter (query) {
      return array.filter(item => matcher(item, query))
    }
  }
}

function createWriter (array) {
  return {
    create (data) {
      array.push(data)
    },
    update (source, target) {
      array.splice(
        array.findIndex(item => item === source),
        1,
        target
      )
    },
    delete (data) {
      array.splice(
        array.findIndex(item => item === data),
        1
      )
    }
  }
}

function createPlugin (array, matcher) {
  return {
    reader: createReader(array, matcher),
    writer: createWriter(array)
  }
}

// Simple mutation
function setAge (entityData, age) {
  return {
    ...entityData,
    age
  }
}

function toRegExp (value) {
  return typeof value === 'string'
    ? new RegExp(value)
    : value
}

async function foo () {
  const database = []

  const store = createStore(
    createPlugin(
      database,
      (item, query) => toRegExp(query).test(item.name)
    )
  )

  // Create new entity
  const steven = await store
    .create({ name: 'steven', age: 16 })
    .unwrap()
  // Logs "{ name: 'steven', age: 16 }"
  console.log(steven)

  // Read and update entity
  const newSteven = await store
    .read('steven')
    .update(setAge, 24)
    .unwrap()
  // Logs "{ name: 'steven', age: 24 }"
  console.log(newSteven)

  // Try to read and update an entity
  const noOne = await store
    .find('phteven')
    .update(setAge, Infinity)
    .unwrap()
  // Logs "null"
  console.log(noOne)

  // Read entity from variable and delete
  const deadSteven = await store
    .from(newSteven)
    .delete()
    .unwrap()

  // Create multiple entities
  const newPeople = await store
    .create([
      { name: 'alice', age: 18 },
      { name: 'bob', age: 19 },
      { name: 'charlie', age: 25 },
      { name: 'dave', age: 22 },
      { name: 'jennifer', age: 30 },
      { name: 'robert', age: 33 }
    ])
    .unwrap()

  // Multiple read and update
  const updatedPeople = await store
    .filter(/li/)
    .update(setAge, 42)
    .unwrap()
  // Logs "[ { name: 'alice', age: 42 }, { name: 'charlie', age: 42 } ]"
  console.log(updatedPeople)

  // Multiple read and delete
  const deadPeople = await store
    .filter(/ob/)
    .delete()
    .unwrap()

  console.log(database)
  // [
  //   { name: 'alice', age: 42 },
  //   { name: 'charlie', age: 42 },
  //   { name: 'dave', age: 22 },
  //   { name: 'jennifer', age: 30 }
  // ]
}

foo().catch(err => console.error(err))
```
