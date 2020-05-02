# Store

It handles inputted queries and data, returning the corresponding entities.

## find(query)

Defines an entity the may exist.

- `query` `<*>`
- Returns: [`<Entity>`](entity.md)

## read(query)

Defines a required entity.

- `query` `<*>`
- Returns: [`<Entity>`](entity.md)

## filter(query)

Defines a collection of entities.

- `query` `<*>`
- Returns: [`<Entities>`](entities.md)

## create(data)

Defines one or more not-yet-created entities.

- `data` `<Object>` | `<Array>`
- Returns: [`<Entity>`](entity.md) | [`<Entities>`](entities.md)

## from(data)

Defines entities by inputted raw data. Resulting entities are defined as already persisted on their service.

- `data` `<Object>` | `<Array>`
- Returns: [`<Entity>`](entity.md) | [`<Entities>`](entities.md)
