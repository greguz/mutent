# Exports

## createStore(plugin)

Creates a [Store](store.md).

## isEntity(value)

Returns `true` when `value` is an [Entity](entity.md) instance.

- `value` `<*>`
- Returns: `<Boolean>`

## areEntities(value)

Returns `true` when `value` is an [Entities](entities.md) instance.

- `value` `<*>`
- Returns: `<Boolean>`

## createEntity(one[, settings])

Defines a not-yet-persisted [Entity](entity.md).

- `one` `<Object>` | `<Promise>` | `<Function>`
- `settings` `<Object>`
  - `autoCommit` `<Boolean>`
  - `classy` `<Boolean>`
  - `historySize` `<Number>`
  - `safe` `<Boolean>`
  - `writer` `<Object>` See [here](writer.md).
- Returns: [`<Entity>`](entity.md)

## readEntity(one[, settings])

Defines a persisted [Entity](entity.md).

- `one` `<Object>` | `<Promise>` | `<Function>`
- `settings` `<Object>`
  - `autoCommit` `<Boolean>`
  - `classy` `<Boolean>`
  - `historySize` `<Number>`
  - `safe` `<Boolean>`
  - `writer` `<Object>` See [here](writer.md).
- Returns: [`<Entity>`](entity.md)

## createEntities(many[, settings])

Defines multiple not-yet-persisted [Entities](entities.md).

- `many` `<Iterable>` | `<AsyncIterable>` | `<Readable>` | `<Function>`
- `settings` `<Object>`
  - `autoCommit` `<Boolean>`
  - `classy` `<Boolean>`
  - `historySize` `<Number>`
  - `safe` `<Boolean>`
  - `writer` `<Object>` See [here](writer.md).
- Returns: [`<Entities>`](entities.md)

## readEntities(many[, settings])

Defines multiple persisted [Entities](entities.md).

- `many` `<Iterable>` | `<AsyncIterable>` | `<Readable>` | `<Function>`
- `settings` `<Object>`
  - `autoCommit` `<Boolean>`
  - `classy` `<Boolean>`
  - `historySize` `<Number>`
  - `safe` `<Boolean>`
  - `writer` `<Object>` See [here](writer.md).
- Returns: [`<Entities>`](entities.md)
