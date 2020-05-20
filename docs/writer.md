# Writer

A Writer defines how write actions need to be performed against a particular data source.

## preCreate(data, options)

Performs a mutation just before creating the entity.

- `data` `<Object>` Entity's data.
- `options` `<Object>` Unwrap options.
- Returns: `<Promise>` | `<Object>`

## create(data, options)

Creates the entity.

- `data` `<Object>` Entity's data.
- `options` `<Object>` Unwrap options.
- Returns: `<Promise>` | `<*>`

## preUpdate(data, options)

Performs a mutation just before updating the entity.

- `data` `<Object>` Entity's data.
- `options` `<Object>` Unwrap options.
- Returns: `<Promise>` | `<Object>`

## update(source, target, options)

Updates the entity.

- `source` `<Object>` Entity's data **before** any mutation are applied.
- `target` `<Object>` Entity's data **after** all described mutations are applied.
- `options` `<Object>` Unwrap options.
- Returns: `<Promise>` | `<*>`

## preDelete(data, options)

Performs a mutation just before deleting the entity.

- `data` `<Object>` Entity's data.
- `options` `<Object>` Unwrap options.
- Returns: `<Promise>` | `<Object>`

## delete(data, options)

Deletes the entity.

- `data` `<Object>` Entity's data.
- `options` `<Object>` Unwrap options.
- Returns: `<Promise>` | `<*>`

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
