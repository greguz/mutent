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

## Reader

A [Reader](docs/reader.md) defines how read actions need to be performed against a particular data source.

```javascript
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
```

## Writer

A [Writer](docs/writer.md) defines how write actions need to be performed against a particular data source.

```javascript
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
```

## Store

A [Store](docs/store.md) uses both Reader and Writer to work with the defined data source.

```javascript
const { createStore } = require('mutent')

const database = []

function matcher (item, query) {
  return query instanceof RegExp
    ? query.test(item.name)
    : item.name === query
}

const store = createStore({
  autoCommit: true,
  classy: false,
  historySize: 10,
  safe: true,
  reader: createReader(database, matcher),
  writer: createWriter(database)
})
```

## Entity

An [Entity](docs/entity.md) represents a meaningful set of information. It can optimally administrate its data source's status using a declarative syntax.

<!-- Any described operation will be executed during the entity's unwrapping. Before that moment, no actions are performed. -->

### Create

Calling `store.create` function will declare an entity that's **not** currently persisted inside any data source.

```javascript
const newEntity = store.create({ name: 'steven' })
```

At this point, no operations are performed. The entity describes the _intent_ to create something. To effectively perform the creation, the `entity.unwrap` method must be called. It returns a `Promise` that will resolve to the created data.

```javascript
newEntity.unwrap()
  .then(data => console.log(data)) // Logs "{ name: 'steven' }"
  .catch(err => console.error(err))
```

### Read

The `store.find` method declares an entity that **may** exist inside the configured data source. Unwrapping the entity this time **may** resolve to a `null` value if the requested entity does not exist.

```javascript
store
  .find('steven')
  .unwrap()
  .then(data => console.log(data)) // Logs "{ name: 'steven' }"
  .catch(err => console.error(err))

store
  .find('tyrone')
  .unwrap()
  .then(data => console.log(data)) // Logs "null"
  .catch(err => console.error(err))
```

The `store.read` method declares an entity that **must** exist. The unwrap request is rejected if It's not possible to retrieve the requested entity.

```javascript
store
  .read('tyrone')
  .unwrap()
  .then(data => console.log(data))
  .catch(err => console.error(err)) // Logs "Error: Unknown entity"
```

### Update

Updates are done via mutators. A mutator function defines how the current entity's data needs to change. It accepts the entity's data as the first argument and outputs the mutated one. This time the unwrap will perform two different actions: read the entity and write the difference.

```javascript
function setAge (entity, age) {
  return {
    ...entity,
    age
  }
}

store
  .read('steven')
  .update(setAge, 42)
  .unwrap()
  .then(data => console.log(data)) // Logs "{ name: 'steven', age: 42 }"
  .catch(err => console.error(err))
```

**WARNING**: Inside a mutator, It's **not** safe to direct update the entity's data. You should always return a new object as a mutation result.

### Delete

Similar to update, a delete is performed by calling `entity.delete` method. Here the unwrap will firstly perform a read action, and then a delete action.

```javascript
store
  .read('steven')
  .delete()
  .unwrap()
  .then(data => console.log(data)) // Logs "{ name: 'steven', age: 42 }"
  .catch(err => console.error(err))
```

## Entities

Represents a collection of [Entities](docs/entities.md). By sharing the same API surface of its single counterpart, this collection will let you manipulate multiple entities easily.

### Create

If the `store.create` method receives an array, It will automatically return an entity's collection. The unwrap method this time will return all created entities.

```javascript
store
  .create([
    { name: 'alice' },
    { name: 'bob' },
    { name: 'charlie' }
  ])
  .unwrap()
  .then(data => console.log(data)) // Logs the created entities
  .catch(err => console.error(err))
```

### Read

The `store.filter` method declares a collection of entities that match the defined query.

```javascript
store
  .filter(/e$/)
  .unwrap()
  .then(data => console.log(data)) // Logs alice and charlie
  .catch(err => console.error(err))
```

### Update

Multiple update.

```javascript
store
  .filter(/e$/)
  .update(setAge, 42)
  .unwrap()
  .then(data => console.log(data))
  .catch(err => console.error(err))
```

### Delete

Multiple delete.

```javascript
store
  .filter(/e$/)
  .delete()
  .unwrap()
  .then(data => console.log(data))
  .catch(err => console.error(err))
```

### Stream

Alternatively, an entity collection may be unwrapped with the `entities.stream` method. It returns a Node.js Readable stream that emits the resulting entities.

```javascript
store
  .read(/^b/)
  .stream()
  .on('data', data => console.log(data))
  .on('error', err => console.error(err))
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

function setAge (entity, age) {
  return {
    ...entity,
    age
  }
}

async function foo () {
  const database = []

  function matcher (item, query) {
    return query instanceof RegExp
      ? query.test(item.name)
      : item.name === query
  }

  const store = createStore({
    autoCommit: true,
    classy: false,
    historySize: 10,
    safe: true,
    reader: createReader(database, matcher),
    writer: createWriter(database)
  })

  const steven = await store
    .create({ name: 'steven' })
    .unwrap()
  console.log(steven) // { name: 'steven' }

  const stevenAgain = await store
    .find('steven')
    .unwrap()
  console.log(stevenAgain) // { name: 'steven' }

  const nobody = await store
    .find('tyrone')
    .unwrap()
  console.log(nobody) // null

  try {
    await store.read('tyrone').unwrap()
  } catch (err) {
    console.log(err) // UnknownEntityError: Unknown entity
  }

  const stevenWithAge = await store
    .read('steven')
    .update(setAge, 42)
    .unwrap()
  console.log(database) // [ { name: 'steven', age: 42 } ]

  const lastVersionOfSteven = await store
    .read('steven')
    .delete()
    .unwrap()
  console.log(database) // []

  const newPeople = await store
    .create([
      { name: 'alice' },
      { name: 'bob' },
      { name: 'charlie' }
    ])
    .update(setAge, 42)
    .unwrap()
  console.log(newPeople) // [ { name: 'alice', age: 42 }, ... ]

  const deadPeople = await store
    .filter(/e$/)
    .delete()
    .unwrap()
  console.log(database) // [ { name: 'bob', age: 42 } ]
}

foo().catch(err => console.error(err))
```
