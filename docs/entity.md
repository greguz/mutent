# Entity

It represents a meaningful set of information. It can optimally administrate its data source's status using a declarative syntax.

## update(mutator, ...arguments)

Describes a mutation to apply to the entity's data.

- `mutator` `<Function>`
- `...arguments` `<*>`
- Returns: `<Entity>`

A `mutator` is a function that always accepts the entity's data as the first argument. It **must** return a new object that represents the fully updated entity.

**WARNING**: Inside a mutator, It's **not** safe to direct update the entity's data. You should always return a new object as mutation result.

## assign(data)

Mimics the `Object.assign` method by extending the entity's data with the passed argument.

- `data` `<Object>`
- Returns: `<Entity>`

## delete()

Schedules the entity deletion.

- Returns: `<Entity>`

## commit()

Schedules a synchronization between the current entity's data and its data source. The entity might be created, updated, or deleted. More informations [here](commit.md).

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
  - `autoCommit` `<Boolean>`
  - `safe` `<Boolean>`
- Returns: `<Promise>`
