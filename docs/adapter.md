# Adapter

An _Adapter_ is an object that defines the way with one or more [_Entities_](./entity.md) should persisted inside a particular (document oriented) _Datastore_.

Mutent doesn't include any Adapter by default. A set of external Adapters and Plugins can be found in the [Ecosystem](./ecosystem.md) section.

An Adapter handles only three types of data:
- A Datastore-specific search query
- The Entity data (Entities retrieved _from_ the Datastore, or Entities that should be written _to_ the Datastore)
- A set of Datastore-specific options

All functions and properties are optional and can be omitted if needed.

## API

### `Symbol.for('adapter-name')`

Returns a descriptive Adapter's name. This name will be present inside all Adapter-related [errors](./errors.md).

- Returns: `<string>`

### `find(query, options)`

Returns the first Entity's data that matches the requested `query` or a nullish value. Can also return a `Promise` that resolves in the Entity's data or a nullish value.

- `query` `<*>`
- `options` `<Object>`
- Returns: `<*>`

### `filter(query, options)`

Returns an `Iterable` (or an `AsyncIterable`) that will `yield` all Entities' data that match the requested `query`.

- `query` `<*>`
- `options` `<Object>`
- Returns: `<Iterable>` | `<AsyncIterable>`

### `create(data, options)`

Creates a new Entity inside the Datastore. If this operation alters the Entity, the updated version of the Entity needs to be returned. It can return a `Promise`.

- `data` `<*>` Entity's data.
- `options` `<Object>` Datastore-specition options object.
- Returns: `<*>`

### `update(oldData, newData, options)`

Updates a Datastore's Entity. If this operation alters the Entity, the updated version of the Entity needs to be returned. It can return a `Promise`.

- `oldData` `<*>` The oridinal Entity retrieved from the Datastore without any alteration.
- `newData` `<*>` The updated version of the Entity after all desired mutations (at least one) are applied.
- `options` `<Object>` Datastore-specition options object.
- Returns: `<*>`

### `delete(data, options)`

Removes an Entity from the Datastore. It can return a `Promise`.

- `data` `<*>` The oridinal Entity retrieved from the Datastore without any alteration.
- `options` `<Object>` Datastore-specition options object.
- Returns: `<*>`

### `bulk(actions, options)`

Performs multiple write-like actions (create, update, delete). See [Bulk Actions](#bulk-actions) section.

- `actions` `<Object[]>` Array of bulk-actions that should be written to the Datastore.
- `options` `<Object>` Datastore-specition options object.
- Returns: `<*>`

## Example

```javascript
class ArrayAdapter {
  get [Symbol.for('adapter-name')] () {
    return 'MyInMemoryArrayAdapter'
  }

  constructor (items) {
    this.items = items || []
  }

  find (query) {
    // We expect a preficate function as query
    return this.items.find(query)
  }

  filter (query) {
    // An Array is also an Iterable
    return this.items.filter(query)
  }

  create (data) {
    this.items.push(data)
  }

  update (oldData, newData) {
    this.items.splice(
      this.items.findIndex(item => item === oldData),
      1,
      newData
    )
  }

  delete (data) {
    this.items.splice(
      this.items.findIndex(item => item === data),
      1
    )
  }
}
```

## Bulk Actions

The `bulk` method is a way to optimize multiple writes into a single action against the Datastore. The number of actions is defined by the [Store](./store.md)'s `writeSize`  option.

Action objects hold the same properties that are used by the other write methods: `data`, `oldData`, `newData`, and `options`.

```javascript
const createAction = {
  type: 'CREATE',
  data: { ... }
}

const updateAction = {
  type: 'UPDATE',
  oldData: { ... },
  newData: { ... }
}

const deleteAction = {
  type: 'DELETE',
  data: { ... }
}
```

Bulk actions can also alter the Entity during the write call.

```javascript
const adapter = {
  async bulk (actions, options) {
    const result = {}

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i]

      if (action.type === 'CREATE') {
        // Create the Entity and retrieve its identifier
        const id = await createObject(action.data)
        // Notify that the "i"-th action has created an identifier
        result[i] = { ...action.data, id }
      } else if (action.type === 'UPDATE') {
        await replaceObject(action.oldData.id, action.newData)
      } else if (action.type === 'DELETE') {
        await deleteObject(action.data.id)
      }
    }

    return result
  }
}
```
