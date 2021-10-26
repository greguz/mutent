# Hooks

Mutent provides a hooks system that can be used to change or extend its normal feature-set.

An hook can be registered directly to store's level, or as a plugin with `register` method. It's also possibile to register multiple hooks at the same time with an array of functions.

```javascript
import { Store } from 'mutent'

const store = new Store({
  adapter: {},
  hooks: {
    // Single hook declaration (single function)
    onEntity (entity, context) {
      // First hook triggered
    }
  }
})

store.register({
  hooks: {
    // Multiple hooks declaration (array of functions)
    onEntity: [
      (entity, context) => {
        // Second hook triggered
      }
    ]
  }
})
```

## List of hooks

- [Query hooks](#query-hooks)
  - [onFind](#onfind)
  - [onFilter](#onfilter)
- [Entity hooks](#entity-hooks)
  - [onEntity](#onentity)
  - [beforeCreate](#beforecreate)
  - [beforeUpdate](#beforeupdate)
  - [beforeDelete](#beforedelete)
  - [afterCreate](#aftercreate)
  - [afterUpdate](#afterupdate)
  - [afterDelete](#afterdelete)

## Query hooks

### onFind

Triggered when a single entity is fetched from the persistence layer.

> **TIP**: This hook can be handy to validate or change query parameters.

```javascript
store.register({
  hooks: {
    onFind (query, context) {
      // Set security filter
      query.tenantId = 'myId'
    }
  }
})
```

### onFilter

Triggered when multiple entities are fetched from the persistence layer.

> **TIP**: This hook can be handy to validate or change query parameters.

```javascript
store.register({
  hooks: {
    onFilter (query, context) {
      // Set security filter
      query.tenantId = 'myId'
    }
  }
})
```

## Entity hooks

### onEntity

Triggered when an [entity](entity.md) is ready to be processed by the [mutation](mutation.md). This hook can be `async`.

```javascript
store.register({
  hooks: {
    async onEntity (entity, context) {
      // Extend entity
      entity.meta.analysis = analyzeContent(entity.valueOf())
    }
  }
})
```

### beforeCreate

Triggered before any entity creation. This hook can be `async`.

```javascript
store.register({
  hooks: {
    async beforeCreate (entity, context) {
      // Do something
    }
  }
})
```

### beforeUpdate

Triggered before any entity update. This hook can be `async`.

```javascript
store.register({
  hooks: {
    async beforeUpdate (entity, context) {
      // Do something
    }
  }
})
```

### beforeDelete

Triggered before any entity deletion. This hook can be `async`.

```javascript
store.register({
  hooks: {
    async beforeDelete (entity, context) {
      // Do something
    }
  }
})
```

### afterCreate

Triggered after any entity creation. This hook can be `async`.

```javascript
store.register({
  hooks: {
    async afterCreate (entity, context) {
      // Do something
    }
  }
})
```

### afterUpdate

Triggered after any entity update. This hook can be `async`.

```javascript
store.register({
  hooks: {
    async afterUpdate (entity, context) {
      // Do something
    }
  }
})
```

### afterDelete

Triggered after any entity deletion. This hook can be `async`.

```javascript
store.register({
  hooks: {
    async afterDelete (entity, context) {
      // Do something
    }
  }
})
```
