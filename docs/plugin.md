# createStore(plugin)

A plugin defines how Mutent has to interact with a specific data source. Its purpose is to be used to create a [store](store.md).

- `plugin` `<Object>`
  - `get` `<Function>`
  - `find` `<Function>`
  - `missing` `<Function>`
  - `create` `<Function>`
  - `update` `<Function>`
  - `delete` `<Function>`
  - `defaults` `<Object>` Default options.
  - `historySize` `<Number>` Will effect undo/redo mutations history.

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

## create(data, options)

Creates the entity against its data source. During this procedure, the entity's data may be changed and then returned. Promises are also supported.

- `data` `<Object>`
- `options` `<Object>`
- Returns: `<Promise>` | `<Object>` | `<undefined>`

## update(source, target, options)

Updates the entity against its data source. The `source` variable represents the entity's data just after its retrieving from its data source.  The `target` variable represents the resulting data after all configured mutations are applied. During this procedure, the entity's data may be changed and then returned. Promises are also supported.

- `source` `<Object>`
- `target` `<Object>`
- `options` `<Object>`
- Returns: `<Promise>` | `<Object>` | `<undefined>`

## delete(data, options)

It deletes the entity against its data source. During this procedure, the entity's data may be changed and then returned. Promises are also supported.

- `data` `<Object>`
- `options` `<Object>`
- Returns: `<Promise>` | `<Object>` | `<undefined>`

## Example

```javascript
function match (query) {
  return typeof query === 'number'
    ? item => item.id === query
    : item => item.name === query
}

function createArrayPlugin () {
  const items = []
  return {
    get: query => items.find(match(query)),
    find: query => items.filter(match(query)),
    missing: query => new Error(`Item "${query}" not found`),
    create: data => {
      items.push(data)
    },
    update: (source, target) => {
      items.splice(
        items.findIndex(match(source.id)),
        1,
        target
      )
    },
    delete: data => {
      items.splice(items.findIndex(match(data.id)), 1)
    }
  }
}
```