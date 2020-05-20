# Reader

A Reader defines how read actions need to be performed against a particular data source.

## find(query, options)

Retrieves a single entity's data.

- `query` `<*>`
- `options` `<Object>` Unwrap options.
- Returns: `<Promise>` | `<Object>` | `<null>` | `<undefined>`

## filter(query, options)

Retrieves multiple entities' data.

- `query` `<*>`
- `options` `<Object>` Unwrap options.
- Returns: `<Iterable>` | `<AsyncIterable>` | `<Readable>`

## Error(query, options)

Constructs the thrown error used while [reading](store.md#storereadquery) a required entity.

- `query` `<*>`
- `options` `<Object>` Unwrap options.
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
