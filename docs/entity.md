# Entity

An Entity instance holds the original data representation of an object taken from the Datastore (`null` if It doesn't yet exist). It also holds a set of flags indicating if the Entity needs to be created, updated, or deleted from the Datastore.

## API

### `Entity.create(data)`

Declares an Entity that needs to be created inside the Datastore. This static method is just an alias of `new Entity(data)`.

- `data` `<*>` The data that needs to be created inside the Datastore.
- Returns: `<Entity>`

### `Entity.read(data)`

Declares an entity that was read read from the Datastore. This static method is just an alias of `Entity.create(data).commit()`.

- `data` `<*>` The data that was read from the Datastore.
- Returns: `<Entity>`

### `Entity::source`

Contains the original data retrieved from the Datastore. A `null` value indicates that this Entity is new (needs to be created).

- Returns: `<*>`

> **WARNING**: This value should be left untouched. Any alteration could interfere with the correct functioning of the Adapter.

### `Entity::target`

It contains the wanted representation of the Entity after all mutations are applied. When the Entity is read from the Datastore, this value equals to the `source` value.

- Returns: `<*>`

> **WARNING**: This value should be left untouched. To alter this value use [`update`](#entityupdatedata) or [`set`](#entitysetdata) method. Any alteration could interfere with the correct functioning of the Adapter.

### `Entity::meta`

Opaque object where plugins can save any Entity-scoped metadata and other info.

- Returns: `<Object>`

### `Entity::shouldCreate`

Returns `true` when the Entity needs to be created inside the Datastore.

- Returns: `<boolean>`

```javascript
import { Entity } from 'mutent'

console.log(Entity.create({}).shouldCreate) // true
console.log(Entity.read({}).shouldCreate) // false
```

### `Entity::shouldUpdate`

Returns `true` when the Entity has received some changes and needs to be written to the Datastore.

- Returns: `<boolean>`

```javascript
import { Entity } from 'mutent'

const entity = Entity.read({ value: 0 })
console.log(entity.shouldUpdate) // false
console.log(entity.update({ value: 42 }))
console.log(entity.shouldUpdate) // true
```

### `Entity::shouldDelete`

Returns `true` when this Entity was flagged for the deletion from the Datastore.

- Returns: `<boolean>`

```javascript
import { Entity } from 'mutent'

console.log(Entity.create({}).delete().shouldDelete) // false
console.log(Entity.read({}).delete().shouldDelete) // true
```

### `Entity::shouldCommit`

Returns `true` when the Entity needs to be committed (created, updated, or deleted). It's an alias for `entity.shouldCreate || entity.shouldUpdate || entity.shouldDelete`.

- Returns: `<boolean>`

### `Entity::update(data)`

Updates the current entity's value and flags the entity as to be updated.

- `data` `<*>`
- Returns: `<Entity>`

> **WARNING**: The passed `data` must be a complete representation of the entity. It also must be **a different object** from the current one. Treating the entity's data as immutable achieves the possibility of generating optimized update queries at the adapter level.

```javascript
import { Entity } from 'mutent'

const source = { value: 0 }
const entity = Entity.read(source)
console.log(entity.source === source) // true
console.log(entity.shouldUpdate) // false
entity.update(source)
console.log(entity.shouldUpdate) // false
entity.update({ value: 42 })
console.log(entity.shouldUpdate) // true
```

### `Entity::delete()`

Flags this Entity to be deleted.

- Returns: `<Entity>`

### `Entity::commit()`

Declares the Entity as commited and reset all internal flags. This method should be called after a successful write against the Datastore.

- Returns: `<Entity>`

### `Entity::set(data)`

Updates the current data of the Entity (`target` property) without triggering any status change (`shouldUpdate` is left untouched).

- `data` `<*>`
- Returns: `<Entity>`

> **TIP**: This method is useful when you want to update the entity without triggering a commit after.

### `Entity::valueOf()`

Returns the current `target` value.

- Returns: `<*>`
