# Store

The store represents the link between our code and the data source. It can declare all types of entities.

## createStore(settings)

It creates a [store](store.md). Everything is optional.

- `settings` `<Object>`
  - `autoCommit` `<Boolean>` If `true`, any pending mutation is automatically committed while unwrapping. Default `true`.
  - `classy` `<Boolean>`
  - `historySize` `<Number>` Defines the size of mutation history. Defaults `10`.
  - `safe` `<Boolean>` If `true`, enforces that all updated entities must be committed before unwrapping. Default `true`.
  - `driver` `<Object>` See [here](driver.md).
- Returns: `<Store>`

## store.find(query)

It declares an entity that **could exist**.

- `query` `<*>`
- Returns: [`<Entity>`](entity.md)

## store.read(query)

It declares an entity that **must exist**. During the unwrap, if It doesn't exist, an [error](errors.md#EMUT_NOT_FOUND) is thrown.

- `query` `<*>`
- Returns: [`<Entity>`](entity.md)

## store.filter(query)

It declares an **existing** group of entities.

- `query` `<*>`
- Returns: [`<Entities>`](entities.md)

## store.create(data)

It declares one or more **new** entities.

- `data` `<Object>` | `<Array>`
- Returns: [`<Entity>`](entity.md) | [`<Entities>`](entities.md)

## store.from(data)

It declares one or more **existing** entities from raw objects.

- `data` `<Object>` | `<Array>`
- Returns: [`<Entity>`](entity.md) | [`<Entities>`](entities.md)
