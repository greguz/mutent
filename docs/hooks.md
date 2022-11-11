# Hooks

Mutent provides a flexible Hooks system that can be used to change or extend its normal feature-set.

Hooks can be registered directly at [Store](./store.md)'s level or with a [Plugin](./store.md#plugin).

```javascript
import { Store } from 'mutent'

const store = new Store({
  adapter: new MyAdapter(),
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

## Table of contents

- [Query Hooks](#query-hooks)
  - [onFind](#onfindquery-context)
  - [onFilter](#onfilterquery-context)
- [Entity Hooks](#entity-hooks)
  - [onEntity](#onentityentity-context)
  - [beforeCreate](#beforecreateentity-context)
  - [beforeUpdate](#beforeupdateentity-context)
  - [beforeDelete](#beforedeleteentity-context)
  - [afterCreate](#aftercreateentity-context)
  - [afterUpdate](#afterupdateentity-context)
  - [afterDelete](#afterdeleteentity-context)

## Query Hooks

Query hooks are triggered when a Datastore's query is used. Those Hooks are useful when some kind of query manipulation is required (like the apply of a security filter).

> **WARNING**: Those Hooks are synchronous.

### `onFind(query, context)`

Triggered during `FIND` and `READ` intents. This Hook is synchronous.

- `query` `<*>` Datastore-specific query.
- `context` [`<Context>`](./context.md) Mutation Context object.
- Returns: `<*>`

```javascript
store.register({
  hooks: {
    onFind (query, context) {
      // Force a security filter parameter
      query.tenantId = 'myScopedTenantForThisStoreInstance'
    }
  }
})
```

### `onFilter(query, context)`

Triggered during `FILTER` intents. This Hook is synchronous.

- `query` `<*>` Datastore-specific query.
- `context` [`<Context>`](./context.md) Mutation Context object.
- Returns: `<*>`

```javascript
store.register({
  hooks: {
    onFilter (query, context) {
      // Force a security filter parameter
      query.tenantId = 'myScopedTenantForThisStoreInstance'
    }
  }
})
```

## Entity Hooks

This kind of Hooks handle Entity instances and can be asynchronous.

### `onEntity(entity, context)`

Triggered when an Entity is ready to be processed by the current Mutation. This Hook can be `async`.

- `entity` [`<Entity>`](./entity.md) Current Entity instance.
- `context` [`<Context>`](./context.md) Mutation Context object.
- Returns: `<*>`

```javascript
store.register({
  hooks: {
    async onEntity (entity, context) {
      // Extend entity because of reasons
      entity.meta.analysis = analyzeContent(entity.valueOf())
    }
  }
})
```

### `beforeCreate(entity, context)`

Triggered just before the creation of a new Entity. This Hook can be `async`.

- `entity` [`<Entity>`](./entity.md) Current Entity instance.
- `context` [`<Context>`](./context.md) Mutation Context object.
- Returns: `<*>`

```javascript
store.register({
  hooks: {
    async beforeCreate (entity, context) {
      // Do something
    }
  }
})
```

### `beforeUpdate(entity, context)`

Triggered just before the update of an existing Entity. This Hook can be `async`.

- `entity` [`<Entity>`](./entity.md) Current Entity instance.
- `context` [`<Context>`](./context.md) Mutation Context object.
- Returns: `<*>`

```javascript
store.register({
  hooks: {
    async beforeUpdate (entity, context) {
      // Do something
    }
  }
})
```

### `beforeDelete(entity, context)`

Triggered just before the deletion of an existing Entity. This Hook can be `async`.

- `entity` [`<Entity>`](./entity.md) Current Entity instance.
- `context` [`<Context>`](./context.md) Mutation Context object.
- Returns: `<*>`

```javascript
store.register({
  hooks: {
    async beforeDelete (entity, context) {
      // Do something
    }
  }
})
```

### `afterCreate(entity, context)`

Triggered right after the creation of a new Entity. This Hook can be `async`.

- `entity` [`<Entity>`](./entity.md) Current Entity instance.
- `context` [`<Context>`](./context.md) Mutation Context object.
- Returns: `<*>`

```javascript
store.register({
  hooks: {
    async afterCreate (entity, context) {
      // Do something
    }
  }
})
```

### `afterUpdate(entity, context)`

Triggered right after the update of an existing Entity. This Hook can be `async`.

- `entity` [`<Entity>`](./entity.md) Current Entity instance.
- `context` [`<Context>`](./context.md) Mutation Context object.
- Returns: `<*>`

```javascript
store.register({
  hooks: {
    async afterUpdate (entity, context) {
      // Do something
    }
  }
})
```

### `afterDelete(entity, context)`

Triggered right after the deletion of an existing Entity. This Hook can be `async`.

- `entity` [`<Entity>`](./entity.md) Current Entity instance.
- `context` [`<Context>`](./context.md) Mutation Context object.
- Returns: `<*>`

```javascript
store.register({
  hooks: {
    async afterDelete (entity, context) {
      // Do something
    }
  }
})
```
