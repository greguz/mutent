# mutent

[![npm version](https://badge.fury.io/js/mutent.svg)](https://badge.fury.io/js/mutent)
[![Dependencies Status](https://david-dm.org/greguz/mutent.svg)](https://david-dm.org/greguz/mutent.svg)
[![Build Status](https://travis-ci.com/greguz/mutent.svg?branch=master)](https://travis-ci.com/greguz/mutent)

An insanely small utility that helps you to keep business logic and other code separated.

## Entity

An _entity_ represents a meaningful collection of data.
This library provides a convenient way to manipulate entities and organize the manipulation code.

### Create

The `create` function returns a new _entity_.

```javascript
const entity = mutent.create({
  username: "pfudor",
  password: "PinkFluffyUnicornDancingOnRainbows"
})
```

### Read

The `read` function is almost identical to the `create` function.
The only difference is that we are telling that this _entity_ is **already saved somewhere**,
and we just read the data from the source.
It supports **lazy readings** by passing a function as first argument.

```javascript
const e0 = mutent.read({ comment: "Pass the entity data directly" })
const e1 = mutent.read(() => ({ comment: "Lazy read with functions" }))
const e2 = mutent.read(async () => ({ comment: "Lazy (async) read with promises" }))
```

### Update

After its creation, the entity data is hidden, and there's no way to alter its status directly.
To perform an update it's necessary a mapper: a function that takes the entity data as input, and output the updated one.
After the execution, a new entity is returned.

After any manipulation, the current entity is not valid anymore, so if you try to perform
a double update to the same entity, an error is raised.
This ensure that we are always working with the last version of the entity.

```javascript
const oldEntity = mutent.create({ value: 12 })

const newEntity = oldEntity.update(data => {
  return {
    ...data,
    updated: new Date()
  }
})

newEntity.update(data => { ...data }) // OK
oldEntity.update(data => { ...data }) // Error
```

### Assign

The `assign` method mimics `Object.assign`, so it performs an update by joining the entity data and the passed argument.

```javascript
mutent
  .create({ a: 1 })
  .assign({ b: 2 })
  .update(data => ({ a: data.a * 2, b: data.b * 2 }))
```

### Delete

By calling the `delete` function, the entity data is set to `null` to indicate that this entity needs to be deleted.

Tip: you can perform a deletion using the `update` method by returning `null` inside the mapper function.

### Unwrap

When `unwrap` method is called, the data is persisted on the configured datastore (defined throught **commit** function)
and returned within a `Promise`.

To achive data persistence, `create` and `read` functions may accept a **commit** procedure as second argument.

The *commit* function define the way to **write** and **persist** the _entity_ data, and It's called automatically
anytime that `unwrap` function is fired.

It consists in a function that accepts three arguments and **may** return a `Promise`:
- `source` data when the entity was loaded the first time (`create` or `read`)
- `target` resulting data after all the configured manipulations
- `options` first argument of `unwrap` method

```javascript
async function commit (source, target, options) {
  if (source === null) {
    // create > there's no source data, this entity is new
  } else if (target === null) {
    // delete > there's no target data, this entity was deleted
  } else {
    // update > you can just write target data,
    //          or diff source and target to update more efficently
  }
}

async function foo () {
  // Define a new entity
  const entity = mutent.create({ message: "Hello World" }, commit)
  // Call unwrap to commit and retrieve the entity data
  const data = await entity.unwrap()
  // All done
  console.log(data.message)
}
```

## Examples

You can check the _examples_ dir inside this repo.
