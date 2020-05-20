# Store

Represents a data source.

## createStore(plugin)

Creates a [Store](store.md). All optional.

- `plugin` `<Object>`
  - `autoCommit` `<Boolean>` If `true`, any pending mutation is automatically committed while unwrapping. Default `true`.
  - `classy` `<Boolean>`
  - `historySize` `<Number>` Defines the size of mutation history. Defaults `10`.
  - `safe` `<Boolean>` If `true`, enforces that all updated entities must be committed before unwrapping. Default `true`.
  - `reader` `<Reader>` See [here](reader.md).
  - `writer` `<writer>` See [here](writer.md).
- Returns: `<Store>`

## store.find(query)

Defines an entity that **may** exist.

- `query` `<*>`
- Returns: [`<Entity>`](entity.md)

## store.read(query)

Defines a **required** entity.

- `query` `<*>`
- Returns: [`<Entity>`](entity.md)

## store.filter(query)

Defines a collection of entities.

- `query` `<*>`
- Returns: [`<Entities>`](entities.md)

## store.create(data)

Defines one or more not-yet-created entities.

- `data` `<Object>` | `<Array>`
- Returns: [`<Entity>`](entity.md) | [`<Entities>`](entities.md)

## store.from(data)

Defines one or more entities by raw data.

- `data` `<Object>` | `<Array>`
- Returns: [`<Entity>`](entity.md) | [`<Entities>`](entities.md)
