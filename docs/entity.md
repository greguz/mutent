# Entity

An entity instance is the representation of a meaningful collection of data that can be persisted inside the persistence layer. Because of that, all methods update in-place the entity's content.

## Static methods

### **Entity.create(data)**

Declares an entity that is still not persisted (needs to be created).

- `data` `<*>`
- Returns: `<Entity>`

### **Entity.read(data)**

Declares an entity that is persisted (read from the persistence layer).

- `data` `<*>`
- Returns: `<Entity>`

## Properties

### **Entity#source**

Contains the original data fetched from the persistence layer. A `null` value indicates that this entity is new (not persisted).

> **WARNING**: This value should be left untouched. Any modification could interfere with the correct functioning of the adapter.

### **Entity#target**

It contains the current representation of the entity after any modification is applied.

> **TIP**: It's the same value returned by the [`valueOf`](#entityvalueof) method.

### **Entity#meta**

Opaque object where plugins can save any entity-related metadata.

> **TIP**: This object is especially useful for plugins implementers to store entity-related data. Mutent will never read or override those data.

## Getters

### **Entity#shouldCreate**

It'll be `true` when the current entity should be created as new inside the persistence layer.

```javascript
import { Entity } from 'mutent'

Entity.create({}).shouldCreate // true
Entity.read({}).shouldCreate // false
```

### **Entity#shouldUpdate**

It'll be `true` when the current entity should be updated at the persistence layer.

```javascript
import { Entity } from 'mutent'

const entity = Entity.read({ value: 0 })
entity.shouldUpdate // false
entity.update({ value: 42 })
entity.shouldUpdate // true
```

### **Entity#shouldDelete**

It'll be `true` when the current entity should be deleted from the persistence layer.

```javascript
import { Entity } from 'mutent'

Entity.create({}).delete().shouldDelete // false
Entity.read({}).delete().shouldDelete // true
```

### **Entity#shouldCommit**

It'll be `true` when one of the [shouldCreate](#entityshouldcreate), [shouldUpdate](#entityshouldupdate), or [shouldDelete](#entityshoulddelete) properties is `true`.

## Instance methods

### **Entity#commit()**

Set the entity's status as persisted.

- Returns: `<Entity>`

### **Entity#delete()**

Flags the entity as to be deleted.

- Returns: `<Entity>`

### **Entity#set(data)**

Set the current entity's value without changing its status (no flagging).

- `data` `<*>`
- Returns: `<Entity>`

> **TIP**: This method is useful when you want to update the entity without triggering a commit after.

### **Entity#update(data)**

Updates the current entity's value and flags the entity as to be updated.

- `data` `<*>`
- Returns: `<Entity>`

> **WARNING**: The passed `data` must be a complete representation of the entity. It also must be **a different object** from the current one. Treating the entity's data as immutable achieves the possibility of generating optimized update queries at the adapter level.

### **Entity#valueOf()**

Returns the raw entity's value.

- Returns: `<*>`

> **TIP**: This is the standard method to retrieve the entity's content.
