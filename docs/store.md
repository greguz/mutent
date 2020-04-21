# Store

It handles inputted queries and data, returning the corresponding entities.

## get(query)

Retrieves a single entity that may be `null`.

- `query` `<*>`
- Returns: [`<Entity>`](entity.md)

## read(query)

Retrieves a single existent entity.

- `query` `<*>`
- Returns: [`<Entity>`](entity.md)

## create(data)

Defines a not yet created entity.

- `data` `<Object>`
- Returns: [`<Entity>`](entity.md)

## find(query)

Retrieves multiple entities at the same time.

- `query` `<*>`
- Returns: [`<Entities>`](entities.md)

## insert(data)

Defines many not yet created entities.

- `data` `<Array>`
- Returns: [`<Entities>`](entities.md)

## from(data)

Defines entities by inputted raw data. Resulting entities are defined as already persisted on their data source.

- `data` `<Object>` | `<Object[]>`
- Returns: [`<Entity>`](entity.md) | [`<Entities>`](entities.md)

## Example

```javascript
// TODO
```
