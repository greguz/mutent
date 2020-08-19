# Exports

## createMutation([settings])

Defines a new mutation.

- `settings` `<Object>`
  - `classy` `<Boolean>`
  - `historySize` `<Number>`

## createEntity(one[, settings])

Defines a not-yet-persisted [Entity](entity.md).

- `one` `<Object>` | `<Promise>` | `<Function>`
- `settings` `<Object>`
  - `autoCommit` `<Boolean>`
  - `classy` `<Boolean>`
  - `historySize` `<Number>`
  - `safe` `<Boolean>`
  - `driver` `<Object>` See [here](driver.md).
- Returns: [`<Entity>`](entity.md)

## readEntity(one[, settings])

Defines a persisted [Entity](entity.md).

- `one` `<Object>` | `<Promise>` | `<Function>`
- `settings` `<Object>`
  - `autoCommit` `<Boolean>`
  - `classy` `<Boolean>`
  - `historySize` `<Number>`
  - `safe` `<Boolean>`
  - `driver` `<Object>` See [here](driver.md).
- Returns: [`<Entity>`](entity.md)

## createEntities(many[, settings])

Defines multiple not-yet-persisted [Entities](entities.md).

- `many` `<Iterable>` | `<AsyncIterable>` | `<Readable>` | `<Function>`
- `settings` `<Object>`
  - `autoCommit` `<Boolean>`
  - `classy` `<Boolean>`
  - `historySize` `<Number>`
  - `safe` `<Boolean>`
  - `driver` `<Object>` See [here](driver.md).
- Returns: [`<Entities>`](entities.md)

## readEntities(many[, settings])

Defines multiple persisted [Entities](entities.md).

- `many` `<Iterable>` | `<AsyncIterable>` | `<Readable>` | `<Function>`
- `settings` `<Object>`
  - `autoCommit` `<Boolean>`
  - `classy` `<Boolean>`
  - `historySize` `<Number>`
  - `safe` `<Boolean>`
  - `driver` `<Object>` See [here](driver.md).
- Returns: [`<Entities>`](entities.md)

## createStore(settings)

Creates a [Store](store.md).

- `settings` `<Object>`
  - `autoCommit` `<Boolean>`
  - `classy` `<Boolean>`
  - `historySize` `<Number>`
  - `safe` `<Boolean>`
  - `driver` `<Object>` See [here](driver.md).
- Returns: [`<Store>`](store.md)
