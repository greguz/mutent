# mutent

[![npm version](https://badge.fury.io/js/mutent.svg)](https://badge.fury.io/js/mutent)
[![Dependencies Status](https://david-dm.org/greguz/mutent.svg)](https://david-dm.org/greguz/mutent.svg)
[![Build Status](https://travis-ci.com/greguz/mutent.svg?branch=master)](https://travis-ci.com/greguz/mutent)
[![Coverage Status](https://coveralls.io/repos/github/greguz/mutent/badge.svg?branch=master)](https://coveralls.io/github/greguz/mutent?branch=master)

An insanely small utility that helps you to keep business logic and other code separated.

## Why

This library try to provide an abstracted method to interface to any data source, and a standardized way to write manipulation code.

## Installation

```
npm install --save mutent
```

## Entity

Represents a meaningful collection of data, and provides a convenient way for its manipulation.

### Declaring

- [create](./docs/create.md)
- [read](./docs/read.md)

### Manipulating

- [update](./docs/update.md)
- [assign](./docs/assign.md)
- [delete](./docs/delete.md)
- [commit](./docs/commit.md)

### Exposing

- [unwrap](./docs/unwrap.md)

```javascript
const mutent = require('mutent')

// A data source driver that define write methods
const driver = {
  async create (target, options) {
    // Do something like...
    // await db.insertDocument(target, options)
  },
  async update (source, target, options) {
    // Do something like...
    // const updateQuery = diffObjects(source, target)
    // await db.updateDocument(source.id, updateQuery, options)
  },
  async delete (source, options) {
    // Do something like...
    // await db.removeDocument(source.id, options)
  }
}

// A nice pure-JS mutation procedure
function setDocumentMessage (data, message) {
  return {
    ...data,
    message,
    updatedAt: new Date()
  }
}

mutent
  // Declare a new entity
  .create({ id: 42, createdAt: new Date() }, driver)
  // Describe mutation
  .update(setDocumentMessage, 'Hello World')
  // Require data source write
  .commit()
  // Execute and expose
  .unwrap({ here: 'some options' })
  // Get updated entity data (Promise)
  .then(result => console.log(result))
  // Handle errors (Promise)
  .catch(err => console.error(err))

// Will log something like this:
// {
//   id: 42,
//   createdAt: 2020-03-24T17:09:25.044Z,
//   message: 'Hello World',
//   updatedAt: 2020-03-24T17:09:25.045Z
// }
```

## Entities

Represents a collection of entities. It shares the same features of its "single" counterpart, plus some specialized methods. Uses Node.js streams internally to handle large datasets.

### Declaring

- [insert](./docs/insert.md)
- [find](./docs/find.md)

### Manipulating

- [update](./docs/update.md)
- [assign](./docs/assign.md)
- [delete](./docs/delete.md)
- [commit](./docs/commit.md)
- [stream](./docs/stream.md)
- [reduce](./docs/reduce.md)

### Exposing

- [unwrap](./docs/unwrap.md)

<!-- ```javascript
const mutent = require('mutent')

mutent
  .insert([])
// TODO
``` -->
