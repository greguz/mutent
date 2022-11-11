# Mutator

A mutator is a function that takes an `AsyncIterable` and a [Context](./context.md) as arguments and returns an `AsyncIterable`. The `yield`ed values from **both** iterables must be [Entity](./entity.md) instances.

Let's write a simple passthrough Mutator:

```javascript
async function * passthrough (iterable, context) {
  for await (const entity of iterable) {
    yield entity
  }
}
```

A Mutator can be added to a [Mutation](./mutation.md#mutationpipemutators) using the `pipe` method. The `pipe` method will return a **new** mutation instance (immutable).

```javascript
const newMutation = oldMutation.pipe(passthrough)
console.log(newMutation === oldMutation) // false (immutable)
```

An [Entity](./entity.md) is manipulable through its methods. The next snippet will show a simple property set mutator.

```javascript
// Declare mutator's parameters
function set (property, value) {
  // Return the actual mutator
  return async function * setMutator (iterable, context) {
    // Each all entities
    for await (const entity of iterable) {
      // Update entity and yield out
      yield entity.update({
        ...entity.valueOf(),
        [property]: value
      })
    }
  }
}

// Apply mutator
const newMutation = oldMutation.pipe(
  set('myProperty', 42)
)
```



## Included mutators







### `assign(...objects)`

Alias for `update(data => Object.assign({}, data, ...objects))`. See [update](#updatemapper) mutator.

- `...objects` `<Object>`
- Returns: `<Mutator>`

```javascript
import { assign } from 'mutent'

// Declare a store..

store.create({ id: 'myId' })
  .pipe(assign({ value: 42 }))
  .unwrap()
  .then(data => console.log(data)) // { id: 'myId', value: 42 }
```

### `commit()`

Commits all Entities.

- Returns: `<Mutator>`

### `ddelete()`

Flags all Entities for deletion.

- Returns: `<Mutator>`

### `filter(predicate)`

It selects a subset of entities that matches the defined predicate. The predicate is a function that will be fired with `predicate(entity.valueOf(), index)` signaure and must return a boolean.

- `predicate` `<Function>`
  - `data` `<*>` Entity's data representation.
  - `index` `<number>`
  - Returns: `<boolean>`
- Returns: `<Mutator>`

### `pipe(...mutators)`

Concatenates more mutators into a single one.

- `...mutators` `<Mutator>`
- Returns: `<Mutator>`

### `tap(callback)`

Runs a callback for any processed entity. Callback is fired with `callback(entity.valueOf(), index)` signature, and It can return a `Promise`.

- `callback` `<Function>`
  - `data` `<*>` Entity's data representation.
  - `index` `<number>`
  - Returns: `<*>`
- Returns: `<Mutator>`

### `update(mapper)`

Maps the entity's data. The map function if fired with `mapper(entity.valueOf(), index)` signature and must return the update entity's data. Can return a `Promise`.

- `mapper` `<Function>`
  - `data` `<*>` Entity's data representation.
  - `index` `<number>`
  - Returns: `<*>`
- Returns: `<Mutator>`
