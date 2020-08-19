# Mutation

A mutation represents a set of changes that may be applied to an entity.

## update(mutator, ...arguments)

It declares an update to the entity's data.

- `mutator` `<Function>`
- `...arguments` `<*>`
- Returns: `<Mutation>`

The `mutator` function must accept the entity's data as the first argument. All passed arguments, starting from the second one, are passed accordingly to the `mutator` function.

## assign(object)

It mimics the `Object.assign()` method.

- `object` `<Object>`
- Returns: `<Mutation>`

## delete()

It requires the current entity's deletion.

- Returns: `<Mutation>`

## commit()

It **explicitly** requires a [driver](driver.md)'s write.

- Returns: `<Mutation>`

## if(condition, mutation)

It applies a mutation to the current entity when the passed contition is met.

- `condition` `<Boolean>` | `<Function>`
- `mutation` `<Mutation>`
- Returns: `<Mutation>`

## unless(condition, mutation)

It applies a mutation to the current entity when the passed contition is **not** met.

- `condition` `<Boolean>` | `<Function>`
- `mutation` `<Mutation>`
- Returns: `<Mutation>`

## mutate(mutation)

It concatenates the current mutation with another one.

- `mutation` `<Mutation>`
- Returns: `<Mutation>`

## undo([steps])

It undoes last defined actions.

- `steps` `<Number>` Defaults `1`.
- Returns: `<Mutation>`

## redo([steps])

It redoes last undid actions.

- `steps` `<Number>` Defaults `1`.
- Returns: `<Mutation>`
