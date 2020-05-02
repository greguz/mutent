# Writer

How to execute write operations against an external service is defined by the Writer.

## preCreate(data, options)

Performs a mutation just before creating the entity.

- `data` `<Object>` Entity's data.
- `options` `<Object>` Object used while unwrapping.
- Returns: `<Promise>` | `<Object>`

## create(data, options)

Creates the entity.

- `data` `<Object>` Entity's data.
- `options` `<Object>` Object used while unwrapping.
- Returns: `<Promise>` | `<*>`

## preUpdate(data, options)

Performs a mutation just before updating the entity.

- `data` `<Object>` Entity's data.
- `options` `<Object>` Object used while unwrapping.
- Returns: `<Promise>` | `<Object>`

## update(source, target, options)

Updates the entity. The `source` variable represents the entity's data just after its retrieving from its service.  The `target` variable represents the resulting data after all configured mutations are applied.

- `source` `<Object>`Entity's data.
- `target` `<Object>`Entity's data.
- `options` `<Object>` Object used while unwrapping.
- Returns: `<Promise>` | `<*>`

## preDelete(data, options)

Performs a mutation just before deleting the entity.

- `data` `<Object>` Entity's data.
- `options` `<Object>` Object used while unwrapping.
- Returns: `<Promise>` | `<Object>`

## delete(data, options)

Deletes the entity.

- `data` `<Object>` Entity's data.
- `options` `<Object>` Object used while unwrapping.
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
