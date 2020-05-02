# Reader

How to retrieve entities' data from an external service is defined by the Reader.

## find(query, options)

Retrieves an entity's data. May return `null` or `undefined` if there's no result. Promises are also supported.

- `query` `<*>`
- `options` `<Object>`
- Returns: `<Promise>` | `<Object>` | `<null>` | `<undefined>`

## filter(query, options)

Fetches multiple entities' data. Arrays, async iterables, and [Readable](https://nodejs.org/api/stream.html#stream_implementing_a_readable_stream) streams are supported.

- `query` `<*>`
- `options` `<Object>`
- Returns: `<Array>` | `<Readable>` | `<Iterable>` | `<AsyncIterable>` | `<Function>`

## Error(query, options)

Constructs the thrown error used while [reading](store.md#readquery) a required entity.

- `query` `<*>`
- `options` `<Object>`
- Returns: `<Error>`

## Example

```javascript
function createArrayReader (array, matcher) {
  return {
    find (query, options) {
      return array.find(item => matcher(item, query, options))
    },
    filter (query, options) {
      return array.filter(item => matcher(item, query, options))
    }
  }
}
```
