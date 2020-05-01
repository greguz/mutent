# createStore(plugin)

A plugin defines how Mutent has to interact with a specific data source. Its purpose is to be used to create a [store](store.md).

- `plugin` `<Object>`
  - `autoCommit` `<Boolean>` Defaults `true`.
  - `classy` `<Boolean>` Defaults `false`.
  - `historySize` `<Number>` Defaults `10`.
  - `safe` `<Boolean>` Defaults `true`.
  - `reader` [`<Reader>`](reader.md)
  - `writer` [`<Writer>`](writer.md)

## Example

```javascript
function createArrayPlugin (array, property) {
  return {
    reader: createArrayReader(array, property),
    writer: createArrayWriter(array, property)
  }
}
```
