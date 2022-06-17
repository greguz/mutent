# Mutator

Mutators are the heart of this module.

A mutator is a simple function that takes an `AsyncIterable` and a [context](context.md) as arguments and will return a new `AsyncIterable`. The `yield`ed values from **both** iterables must be [entity](entity.md) instances to let Mutent works without issues.

The next example will show an implementation of a simple passthrough mutator.

```javascript
async function * passthrough (iterable, context) {
  for await (const entity of iterable) {
    yield entity
  }
}
```

A mutator can be added to a [mutation](mutation.md) using the `pipe` method. The `pipe` method will return a **new** mutation instance (immutable).

```javascript
const newMutation = oldMutation.pipe(passthrough)
```

An [entity](entity.md) is manipulable through its methods. The next snippet will show a simple property set mutator.

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

### **assign(...objects)**

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

### **commit()**

Declares a write intention against the persistence layer.

- Returns: `<Mutator>`

### **ddelete()**

Declares a delete intention for all processed entities.

- Returns: `<Mutator>`

### **filter(predicate)**

It selects a subset of entities that matches the defined predicate. The predicate is a function that will be fired with `predicate(entity.valueOf(), index)` signaure and must return a boolean.

- `predicate` `<Function>`
- Returns: `<Mutator>`

### **iif(condition, whenTrue[, whenFalse])**

Applies a mutator conditionally. The condition can be either a boolean or a function that returns a boolean. When a function is specified, It will be fired with `condition(entity.valueOf(), index)` signature.

- `condition` `<Boolean>` | `<Function>`
- `whenTrue` `<Mutator>`
- `whenFalse` `<Mutator>` Optional mutator to apply when the condition is not meeted.
- Returns: `<Mutator>`

### **pipe(...mutators)**

Concatenates more mutators into a single one.

- `...mutators` `<Mutator>`
- Returns: `<Mutator>`

### **tap(callback)**

Runs a callback for any processed entity. Callback is fired with `callback(entity.valueOf(), index)` signature, and It can return a `Promise`.

- `callback` `<Function>`
- Returns: `<Mutator>`

### **update(mapper)**

Maps the entity's data. The map function if fired with `mapper(entity.valueOf(), index)` signature and must return the update entity's data. Can return a `Promise`.

- `mapper` `<Function>`
- Returns: `<Mutator>`
