# Writer

A Writer defines how write actions need to be performed against a particular data source.

## create(data, options)

Creates the entity.

- `data` `<Object>` Entity's data.
- `options` `<Object>` Unwrap options.
- Returns: `<Promise>` | `<Object>` | `<null>` | `<undefined>`

## update(data, options, current)

Updates the entity.

- `oldData` `<Object>` Entity's data **after** all described mutations are applied.
- `newData` `<Object>` Entity's data **before** any mutation are applied.
- `options` `<Object>` Unwrap options.
- Returns: `<Promise>` | `<Object>` | `<null>` | `<undefined>`

## delete(data, options)

Deletes the entity.

- `data` `<Object>` Entity's data.
- `options` `<Object>` Unwrap options.
- Returns: `<Promise>` | `<Object>` | `<null>` | `<undefined>`

## routines

TODO

## Example

```javascript
function createArrayWriter (array) {
  return {
    create (data) {
      array.push(data)
    },
    update (source, target) {
      array.splice(
        array.findIndex(item => item === source),
        1,
        target
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
