# Adapter

### **Adapter#find(query, options)**

Returns the entity's data that matches the defined `query` or a _nullish_ value. Can return a `Promise`.

- `query` `<*>`
- `options` `<Object>`

### **Adapter#filter(query, options)**

Returns an `Iterable` that will `yield` all entities that match the defined `query`. Can return an `AsyncIterable`.

- `query` `<*>`
- `options` `<Object>`

### **Adapter#create(data, options)**

Creates a _new_ entity inside the persistence layer. If the write operation adds some data, the method CAN return the just-created entity. `Promise`s are also supported.

- `data` `<*>` The entity data to insert.
- `options` `<Object>`

### **Adapter#update(oldData, newData, options)**

It updates an _existing_ entity against the persistence layer. If the write operation adds some data, the method CAN return the just-updated entity. `Promise`s are also supported.

- `oldData` `<*>` _Original_ entity data retrieved from the persistence layer.
- `newData` `<*>` _Updated_ entity data after all mutations are applied.
- `options` `<Object>`

### **Adapter#delete(data, options)**

It deletes an _existing_ entity from the persistence layer. `Promise`s are also supported.

- `data` `<*>` _Original_ entity data retrieved from the persistence
- `options` `<Object>`

### **Adapter#bulk(actions, options)**

_Optional_ method.

- `actions` `<BulkAction[]>`
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
