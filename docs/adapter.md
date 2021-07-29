# Adapter

The adapter is the component responsible for the communication between the code and the persistence layer.

## find(query, options)

**Mandatory** method. It returns the _entity_ that matches the defined query or a _nullish_ value if the entity doesn't exist. `Promise`s are also supported.

- `query` `<*>`
- `options` `<Object>`

## filter(query, options)

**Mandatory** method. It returns an _iterable_ (can be _async_) that will provide all entities that match the defined query.

- `query` `<*>`
- `options` `<Object>`

## create(data, options)

**Mandatory** method. It creates a _new_ entity inside the persistence layer. If the write operation adds some data, the method CAN return the just-created entity. `Promise`s are also supported.

- `data` `<*>` The entity data to insert.
- `options` `<Object>`

## update(oldData, newData, options)

**Mandatory** method. It updates an _existing_ entity against the persistence layer. If the write operation adds some data, the method CAN return the just-updated entity. `Promise`s are also supported.

- `oldData` `<*>` _Original_ entity data retrieved from the persistence layer.
- `newData` `<*>` _Updated_ entity data after all mutations are applied.
- `options` `<Object>`

## delete(data, options)

**Mandatory** method. It deletes an _existing_ entity from the persistence layer. `Promise`s are also supported.

- `data` `<*>` _Original_ entity data retrieved from the persistence
- `options` `<Object>`

## bulk(actions, options)

_Optional_ method.

- `actions` `<Object[]>`
- `options` `<Object>`

## Example

```javascript
class ArrayAdapter {
  constructor(array = []) {
    this.array = array
  }

  find(query) {
    return this.array.find(query)
  }

  filter(query) {
    return this.array.filter(query)
  }

  create(data) {
    this.array.push(data)
  }

  update(oldData, newData) {
    this.array.splice(
      this.array.findIndex(entity => entity === oldData),
      1,
      newData
    )
  }

  delete(data) {
    this.array.splice(
      this.array.findIndex(entity => entity === data),
      1
    )
  }
}
```
