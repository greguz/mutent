# Driver

The driver describes the communication protocol used by the JavaScript environment and the external data source to communicate. It can be a plain object or a class instance, both ways work. All methods are optional.

## find(query, options, isRequired)

It retrieves the first entity from the configured data source that matches the query. Promises are also supported.

- `query` `<*>`
- `options` `<Object>` Unwrap options.
- `isRequired` `<Boolean>` Is `true` when a required entity is unwrapped.
- Returns: `<Promise>` | `<Object>` | `<null>` | `<undefined>`

## filter(query, options)

It retrieves all entities from the configured data source that matches the query. Must return an Iterable (both sync or async work) or a Node.js stream.

- `query` `<*>`
- `options` `<Object>` Unwrap options.
- Returns: `<Iterable>` | `<AsyncIterable>` | `<Readable>`

## create(data, options)

It creates a new record against the configured data source. Can return an object representing the written data. Promises are also supported.

- `data` `<Object>`
- `options` `<Object>` Unwrap options.
- Returns: `<Promise>` | `<Object>` | `<null>` | `<undefined>`

## update(oldData, newData, options)

It updates a record against the configured data source. Can return an object representing the written data. Promises are also supported.

- `oldData` `<Object>` Originally fetched data from data source.
- `newData` `<Object>` Mutated data (JavaScript).
- `options` `<Object>` Unwrap options.
- Returns: `<Promise>` | `<Object>` | `<null>` | `<undefined>`

## delete(data, options)

It deletes a record against the configured data source. Can return an object representing the written data. Promises are also supported.

- `data` `<Object>`
- `options` `<Object>` Unwrap options.
- Returns: `<Promise>` | `<Object>` | `<null>` | `<undefined>`

## Example

```javascript
function createDriver (array) {
  return {
    find (query) {
      return array.find(query)
    },
    filter (query) {
      return array.filter(query)
    },
    create (data) {
      array.push(data)
    },
    update (oldData, newData) {
      array.splice(
        array.findIndex(item => item === oldData),
        1,
        newData
      )
    },
    delete (data) {
      array.splice(
        array.findIndex(item => item === data),
        1
      )
    }
  }
}
```
