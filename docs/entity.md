# Entity

It fully *extends* a [mutation](mutation.md) and represents a meaningful collection of data.

## unwrap([options])

It applies all described actions and returns a `Promise`. The `Promise` will resolve to the **updated** version of the entity.

- `options` `<Object>`
  - `autoCommit` `<Boolean>`
  - `safe` `<Boolean>`
- Returns: `<Promise>`

## stream([options])

Same as the `uwrap` method, but It returns a `Readable` stream.

- `options` `<Object>`
  - `autoCommit` `<Boolean>`
  - `safe` `<Boolean>`
- Returns: `<Readable>`
