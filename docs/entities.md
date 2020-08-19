# Entities

It fully *extends* a [mutation](mutation.md) and represents a dataset.

## unwrap([options])

It applies all described actions and returns a `Promise`. The `Promise` will resolve to an array containing the **updated** versions of the manipulated entities.

- `options` `<Object>`
  - `autoCommit` `<Boolean>`
  - `safe` `<Boolean>`
- Returns: `<Promise>`

## stream([options])

Same as the `uwrap` method, but It returns a `Readable` stream.

- `options` `<Object>`
  - `autoCommit` `<Boolean>`
  - `concurrency`: `<Number>`
  - `highWaterMark` `<Number>`
  - `safe` `<Boolean>`
- Returns: `<Readable>`
