# Mutator

Mutators are the heart of this module.

## Definition

A mutator is a simple function that takes an `AsyncIterable` and a [context](context.md) as arguments and will return a new `AsyncIterable`. The `yield`ed values from **both** iterables must be [entity](entity.md) instances to let Mutent works without issues.

The next example will show an implementation of a simple passthrough mutator.

```javascript
async function * passthrough (iterable, context) {
  for await (const entity of iterable) {
    yield entity
  }
}
```

A mutator can be added to a [mutation](mutation.md) using the `pipe` method.

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

## Context

The mutator's context contains the configuration of the current mutation.

```javascript
const context = {
  // Store's adapter.
  adapter: {},
  // Store method's arguent that has generated the current mutation.
  argument: {},
  // Configured commit mode.
  commitMode: "AUTO",
  // Mutation's intent (can be "CREATE", "FIND", "READ", "FILTER" and "FROM").
  intent: "CREATE",
  // Indicates if the current mutation could process multiple values.
  multiple: false,
  // Adapter's options provided while unwrapping.
  options: {},
  // Store's name.
  store: "MyStore",
  // Configured write mode.
  writeMode: "AUTO",
  // Configured write side.
  writeSize: 16
}
```

## Included mutators

### **assign(...objects)**

Alias for `update(data => Object.assign({}, data, ...objects))`. See [update](#updatemapper) mutator.

- `...objects` `<Object>`
- Returns: `<Mutator>`

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
