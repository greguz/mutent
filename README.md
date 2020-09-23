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

## Driver

Firstly, we need to write a [driver](docs/driver.md). The driver describes the communication protocol used by the JavaScript environment and the external data source to communicate.

```javascript
function toRegExp(query) {
  return typeof query === 'string' ? new RegExp(`^${query}$`) : query
}

function createDriver(array) {
  return {
    find(query) {
      const reg = toRegExp(query)
      return array.find(item => reg.test(item.name))
    },
    filter(query) {
      const reg = toRegExp(query)
      return array.filter(item => reg.test(item.name))
    },
    create(data) {
      array.push(data)
    },
    update(oldData, newData) {
      array.splice(
        array.findIndex(item => item === oldData),
        1,
        newData
      )
    },
    delete(data) {
      array.splice(
        array.findIndex(item => item === data),
        1
      )
    }
  }
}
```

This little piece of code contains everything we need to manipulate and retrieve from an array.

## Store

Now, using the previously defined driver, we can create a [store](docs/store.md).

```javascript
const { createStore } = require('mutent')

const database = []

const store = createStore({
  autoCommit: true,
  classy: false,
  historySize: 8,
  safe: true,
  driver: createDriver(database)
})
```

## Entity

An [Entity](docs/entity.md) represents a meaningful set of information. Using the store, we can declare multiple types of It.

```javascript
const createSteven = store.create({ name: 'steven' })
```

The variable `createSteven` It's an `Entity` instance and represents the intent to create a new record against the data source. It's important to note that **no writes** will occur until the entity is unwrapped. So, at this stage, we just declared our creation intent, and nothing more.

We can also describe how the entity mutates.

```javascript
function setAge(data, age) {
  return {
    ...data,
    age
  }
}

const createStevenWithAge = createSteven.update(setAge, 42)
```

Now, with the variable `createStevenWithAge`, we have declared the intent to create a new record with two fields.

The entity's update method lets you describe a mutation. It accepts a function (a **mutator**) that takes the current data as the first argument and returns the updated data. Other arguments can be passed directly from the entity's method. This function **must not** change the first argument.

For simple assignments, a faster way to update is available by using the `assign` method. It mimics the `Object.assign()` function.

```javascript
const createStevenWithAge = createSteven.assign({ age: 42 })
```

At this point, we are happy about our entity, and we want to write the described actions and retrieve the resulting data. We can finally unwrap It using the homonymous method. It will return a `Promise` that must be handled accordingly.

```javascript
console.log(database) // []
const steven = await createStevenWithAge.unwrap()
console.log(steven) // { name: 'steven', age: 42 }
console.log(database) // [{ name: 'steven', age: 42 }]
```

If we look at what's inside the `database`, we can see a new item inserted after the unwrapping.

Having a populated database, we can now retrieve some data from It. The store's `read` method will declare an entity that resides inside the data store. But we want to read, so we can directly unwrap the entity.

```javascript
const mustBeSteven = await store.read('steven').unwrap()
```

There's another method that declares existing entities: the `find` method.

```javascript
const maybePhteven = await store.find('phteven').unwrap() // null
```

The entities created by the `read` method must exist. On the other hand, entities created by the `find` method can be non-existent and unwrap to `null`.

Combining the `read` method and the mutators, we can perform an update.

```javascript
const happyBirthdaySteven = await store
  .read('steven')
  .update(setAge, 43)
  .unwrap()
```

Deleting is similar to an update: declare the entity, call the `delete` method and unwrap It.

```javascript
const deadSteven = await store.read('steven').delete().unwrap()
```

## Entities

It is also possible to manage multiple records as a single group of entities.

```javascript
const newPeople = await store
  .create([{ name: 'jack' }, { name: 'jacob' }, { name: 'george' }])
  .assign({ age: 27 })
  .unwrap()

const jaGuys = await store.filter(/^ja/i).unwrap()
```

Passing an array to the `create` method, or using the filter method, will be returned an [Entities](docs/entities.md) instance. This object shares the same APIs of its single counterpart. The only difference is that the `unwrap` method will resolve to an array of objects instead of a single one.

## Streaming

Both instances support streaming through the Node.js streams. Calling the `stream` method will return a Readable.

```javascript
store
  .filter(/^ja/i)
  .stream()
  .on('data', data => console.log(data))
```

## Conditions

Conditional mutations are also supported.

```javascript
const { createMutation } = require('mutent')

function isTeenager(data) {
  return data.age >= 13 && data.age < 20
}

const deletedTeenagers = await store
  .filter(/./)
  .if(isTeenager, createMutation().delete())
  .unwrap()
```
