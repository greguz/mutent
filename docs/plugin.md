# createStore(plugin)

A plugin defines how Mutent has to interact with a specific data source. Its purpose is to be used to create a [store](store.md).

- `plugin` `<Object>`
  - `get` `<Function>`
  - `find` `<Function>`
  - `missing` `<Function>`
  - `preCreate` `<Function>`
  - `create` `<Function>`
  - `preUpdate` `<Function>`
  - `update` `<Function>`
  - `preDelete` `<Function>`
  - `delete` `<Function>`
  - `historySize` `<Number>` Will effect undo/redo mutations history.
  - `classy` `<Boolean>` Set `true` to emulate classic `class` behaviour.
  - `safe` `<Boolean>` | `<String>` Set `true` to enforce committing before any `unwrap`. Set `'auto'` to automatically commit if necessary just before any `unwrap`.

## get(query, options)

Retrieves an entity's data. May return `null` or `undefined` if there's no result. Promises are also supported.

- `query` `<*>`
- `options` `<Object>`
- Returns: `<Promise>` | `<Object>` | `<null>` | `<undefined>`

## find(query, options)

Fetches multiple entities' data. Arrays, async iterables, and [Readable](https://nodejs.org/api/stream.html#stream_implementing_a_readable_stream) streams are supported.

- `query` `<*>`
- `options` `<Object>`
- Returns: `<Readable>` | `<Array>`

## missing(query, options)

Constructs the thrown error used while [reading](store.md#readquery) a required entity.

- `query` `<*>`
- `options` `<Object>`
- Returns: `<*>`

## preCreate(data, options)

Performs a mutation just before creating the entity against its data source.

- `data` `<Object>`
- `options` `<Object>`
- Returns: `<Promise>` | `<Object>`

## create(data, options)

Creates the entity against its data source.

- `data` `<Object>`
- `options` `<Object>`
- Returns: `<*>`

## preUpdate(data, options)

Performs a mutation just before updating the entity against its data source.

- `data` `<Object>`
- `options` `<Object>`
- Returns: `<Promise>` | `<Object>`

## update(source, target, options)

Updates the entity against its data source. The `source` variable represents the entity's data just after its retrieving from its data source.  The `target` variable represents the resulting data after all configured mutations are applied.

- `source` `<Object>`
- `target` `<Object>`
- `options` `<Object>`
- Returns: `<*>`

## preDelete(data, options)

Performs a mutation just before deleting the entity against its data source.

- `data` `<Object>`
- `options` `<Object>`
- Returns: `<Promise>` | `<Object>`

## delete(data, options)

It deletes the entity against its data source.

- `data` `<Object>`
- `options` `<Object>`
- Returns: `<*>`

## Example
```javascript
function match (query) {
  return item => item.name === query
}

function createPlugin () {
  // Data source
  const items = []

  return {
    // Get single entity
    get: query => {
      return items.find(match(query))
    },
    // Get multiple entities
    find: query => {
      return items.filter(match(query))
    },
    // Create entity
    create: data => {
      items.push(data)
    },
    // Update entity
    update: (source, target) => {
      items.splice(
        items.findIndex(match(source.name)),
        1,
        target
      )
    },
    // Delete entity
    delete: data => {
      items.splice(
        items.findIndex(match(data.name)),
        1
      )
    }
  }
}
