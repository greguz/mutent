# Entity

It represents a meaningful collection of data.

## update(mutator, ...arguments)

Describes a mutation. A mutator is a function that takes the entity's data as the first argument and returns the updated version of the entity.

- `mutator` `<Function>`
- `...arguments` `<*>`
- Returns: `<Entity>`

## assign(data)

Mimics the `Object.assign` method by extending the entity's data with the argument's object.

- `data` `<Object>`
- Returns: `<Entity>`

## delete()

Schedules entity deletion.

- Returns: `<Entity>`

## commit()

Schedules a synchronization between the current entity's data and its data source. The entity might be created, updated, or deleted.

- Returns: `<Entity>`

## undo([steps])

Undoes one or more defined actions. `Infinity` is accepted and, if provided, will invalidate all possible actions.

- `steps` `<Number>` Defaults to `1`.
- Returns: `<Entity>`

## redo([steps])

In the case of undid actions, this method reapplies the last reverted actions by the `undo` method. `Infinity` is accepted and, if provided, will reapply all reverted actions.

- `steps` `<Number>` Defaults to `1`.
- Returns: `<Entity>`

## unwrap([options])

It runs all described actions and exposes the resulting entity's data through a `Promise`.

- `options` `<Object>`
- Returns: `<Promise>`

## Example

```javascript
// TODO
```
