# Quickstart

## Common actions

Let's create a simple [Store](./store.md) instance that uses an Array as Datastore.

```javascript
import { Store } from 'mutent'
import { ArrayAdapter } from 'mutent-array'

const store = new Store({
  adapter: new ArrayAdapter()
})
```

### Create an Entity

Let's create a simple Entity.

```javascript
// Declares a Mutation with a "CREATE" Intent
// Nothing is written at this point
const mutation = store.create({ id: 42, name: 'Towel' })
console.log(store.adapter.items) // []

// Performs the actions and returns a Promise
const data = await mutation.unwrap()
console.log(data) // { id: 42, name: 'Towel' }
console.log(store.adapter.items) // [{ id: 42, name: 'Towel' }]
console.log(data === store.adapter.items[0]) // true
```

You can compact the whole chain to:

```javascript
const data = await store
  .create({ id: 42, name: 'Towel' })
  .unwrap()
```

### Read an Entity

To retrieves an Entity, you can do:

```javascript
const ok = await store
  .find(item => item.id === 42)
  .unwrap()

console.log(ok) // { id: 42, name: 'Towel' }

const notOk = await store
  .find(item => item.id === -1)
  .unwrap()

console.log(notOk) // null
```

### Search Entities

To handle more than on Entities:

```javascript
const items = await store
  .filter(() => true) // This will "download" everything
  .unwrap()

console.log(items) // [{ id: 42, name: 'Towel' }]
```

### Update an Entity

To update an Entity, It must be declared as before:

```javascript
const updated = await store
  .find(item => item.id === 42)
  .update(data => ({ ...data, updatedAt: new Date() }))
  .unwrap()

console.log(updated) // { id: 42, name: 'Towel', updatedAt: ISODate }
```

You can also update more than one Entity using the `filter` method:

```javascript
const updatedAt = new Date()

const updated = await store
  .filter(() => true) // All Entities
  .update(data => ({ ...data, updatedAt }))
  .unwrap()

console.log(updated) // [{ id: 42, name: 'Towel', updatedAt: ISODate }]
```

### Delete an Entity

You can delete an Entity as follow:

```javascript
console.log(store.adapter.items) // [{ id: 42, name: 'Towel', updatedAt: ISODate }]

const deleted = await store
  .find(data => data.id === 42)
  .delete()
  .unwrap()

console.log(deleted) // { id: 42, name: 'Towel', updatedAt: ISODate }
console.log(store.adapter.items) // []
```

## Sections

1. [Store](./store.md)
2. [Adapter](./adapter.md)
3. [Entity](./entity.md)
4. [Mutation](./mutation.md)
5. [Mutator](./mutator.md)
6. [Context](./context.md)
7. [Hooks](./hooks.md)
8. [Errors](./errors.md)
9. [Ecosystem](./ecosystem.md)
