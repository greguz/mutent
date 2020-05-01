# Exports

## createStore(plugin)

Creates a [Store](store.md).

- `plugin` [`<Plugin>`](plugin.md)
- Returns: [`<Store>`](store.md)

## isEntity(value)

Returns `true` when `value` is an [Entity](entity.md) instance.

- `value` `<*>`
- Returns: `<Boolean>`

## areEntities(value)

Returns `true` when `value` is an [Entities](entities.md) instance.

- `value` `<*>`
- Returns: `<Boolean>`

## createEntity(one[, settings])

Defines an [Entity](entity.md) that It's **not** yet persisted anywhere.

- `one` `<Object>` | `<Promise>` | `<Function>`
- `settings` [`<Settings>`](#settings)
- Returns: [`<Entity>`](entity.md)

## readEntity(one[, settings])

Defines an [Entity](entity.md) that It's currently persisted inside its data source.

- `one` `<Object>` | `<Promise>` | `<Function>`
- `settings` [`<Settings>`](#settings)
- Returns: [`<Entity>`](entity.md)

## createEntities(many[, settings])

Defines multiple _not-yet-persisted_ [Entities](entities.md).

- `many` `<Array>` | `<Readable>` | `<Iterable>` | `<AsyncIterable>` | `<Function>`
- `settings` [`<Settings>`](#settings)
- Returns: [`<Entities>`](entities.md)

## readEntities(many[, settings])

Defines multiple _persisted_ [Entities](entities.md).

- `many` `<Array>` | `<Readable>` | `<Iterable>` | `<AsyncIterable>` | `<Function>`
- `settings` [`<Settings>`](#settings)
- Returns: [`<Entities>`](entities.md)

## One

TODO

## Many

TODO

## Settings

TODO

- `autoCommit` `<Boolean>` Defaults `true`.
- `classy` `<Boolean>` Defaults `false`.
- `historySize` `<Number>` Defaults `10`.
- `safe` `<Boolean>` Defaults `true`.
- `writer` [`<Writer>`](writer.md)
