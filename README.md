# mutent

[![npm version](https://badge.fury.io/js/mutent.svg)](https://badge.fury.io/js/mutent)
[![Dependencies Status](https://david-dm.org/greguz/mutent.svg)](https://david-dm.org/greguz/mutent.svg)

An insanely small utility that helps you to keep business logic and other code separated.

## Entity

An _entity_ is any data value that may represents something to you.
The most straightforward example is a MongoDB document: the document data is our entity.

### Create

By calling the `create` function, and passing the actual entity data, you create
a new _entity_.

```javascript
const entity = mutent.create({
  username: "pfudor",
  password: "PinkFluffyUnicornDancingOnRainbows"
});
```

### Read

The `read` function is almost identical to the `create` function, the only difference
is that we are telling that this _entity_ is **already saved somewhere**, and
we just read the data from our source.

```javascript
const entity = mutent.read({
  username: "admin",
  password: "0123OHCMON!"
});
```

### Update

After its creation, the entity data is hidden, and there's no way to alter its status directly. To perform an update it's necessary a mutator: a function that takes the
entity data as input, and output the updated one. After the execution, a new entity is returned.

After any mutation, the current entity is not valid anymore, so if you try to
perform a double update to the same entity, an error is raised. This ensure that
we are always working with the last version of the entity.

```javascript
const newEntity = oldEntity.update(data => {
  return {
    ...data,
    updated: new Date()
  };
});

newEntity.update(data => { ... }) // OK

oldEntity.update(data => { ... }) // Error
```

### Delete

By calling the `delete` function, you flag this entity as "to be deleted".

```javascript
const newEntity = oldEntity.delete();

newEntity.update(data => { ... }) // OK (data is null, it's like a creation from scratch)

oldEntity.update(data => { ... }) // Error
```

### Commit

After a creation, or some mutations, or a deletion, you may wish to write the current entity status somewhere: this is the purpose of the `commit` function.

The `create` and the `update` function accept a second argument: a `commit` function.
This function define the method used to store the entity data when whe want to persist the current status.
Most obvious example, is a database write.

The `commit` function must return a `Promise`, and accept three arguments:

- `source` the original data when we loaded the entity (created, read or committed)
- `target` the resulting data after our alterations (updated or deleted)
- `options` some options passed to the _entity_

Here `null` values are special values that indicate something.

#### Creation

If `source` is `null`, it means that this entity (`target`) is new and must be created.

#### Deletion

If `target` is `null`, it means that the `delete` function was called, and this
entity (`source`) must be destroyed.

#### Updation

Both `source` and `target` are usable, you can diff the data and perform the required update.

#### Both null

There is a special case, when an entity is created and deleted before any commit.
In that case, because the entity data resides entirely on memory, the commit call
is automatically skipped, so there's no need to handle that case.

```javascript
async function commit(source, target, options) {
  if (source === null) {
    // create a new entity (target is the data to save)
  } else if (target === null) {
    // delete the entity (source is the entity data)
  } else {
    // update the entity (source is the original data, taget is the updated data)
  }
}

async function run() {
  const inMemoryEntity = mutent.create({ value: 69 }, commit);

  const savedEntity = await inMemoryEntity.commit({
    any: "option",
    here: true
  });
}
```

## Examples

You can check the _examples_ dir inside this repo.

## Usage

```javascript
const mutent = require("mutent");

async function commit(source, target, options) {
  if (source === null) {
    console.log("create", target);
  } else if (target === null) {
    console.log("delete", source);
  } else {
    console.log("update", source, target);
  }
}

async function procedure() {
  // create entity (commit function have to return a Promise)
  const e0 = mutent.create({ a: 1 }, commit);

  // create commit
  // log "create { a: 1 }"
  const e1 = await e0.commit();

  const e2 = e1.update(data => ({ ...data, b: true }));
  const e3 = e2.update(data => ({ ...data, c: "Hello World" }));

  // update commit (with commit options)
  // log "update { a: 1 } { a: 1, b: true, c: 'Hello World' }"
  const e4 = await e3.commit({
    db: "my-db",
    collection: "entities"
  });

  const e5 = e4.delete();

  // delete commit
  // log "delete { a: 1, b: true, c: 'Hello World' }"
  const e6 = await e5.commit();

  // void commit (with fluent API)
  // log nothing
  const dead = await mutent
    .create({}, commit)
    .update(data => ({ ...data, value: "bye bye" }))
    .delete()
    .commit();

  // read entity
  const r0 = mutent.read({ value: 10 }, commit);
  const r1 = r0.update(data => ({ ...data, value: -10 }));

  // update commit
  // log "update { value: 10 } { value: -10 }"
  const r2 = await r1.commit();

  // error "This entity is immutable"
  e2.update(data => data);
}

procedure();
```
