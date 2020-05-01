# Writer

TODO

## preCreate(data, options)

Performs a mutation just before creating the entity against its data source.

- `data` `<Object>`
- `options` `<Object>`
- Returns: `<Promise>` | `<Object>`

## create(data, options)

Creates the entity against its data source.

- `data` `<Object>`
- `options` `<Object>`
- Returns: `<Promise>` | `<*>`

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
- Returns: `<Promise>` | `<*>`

## preDelete(data, options)

Performs a mutation just before deleting the entity against its data source.

- `data` `<Object>`
- `options` `<Object>`
- Returns: `<Promise>` | `<Object>`

## delete(data, options)

It deletes the entity against its data source.

- `data` `<Object>`
- `options` `<Object>`
- Returns: `<Promise>` | `<*>`

## Example

```javascript
function match (property, query) {
  return item => item[property] === query
}

function createArrayWriter (array, property) {
  return {
    create (data) {
      array.push(data)
    },
    update (source, target) {
      array.splice(
        array.findIndex(match(property, source[property])),
        1,
        target
      )
    },
    delete (data) {
      array.splice(
        array.findIndex(match(property, data[property])),
        1
      )
    }
  }
}
```
