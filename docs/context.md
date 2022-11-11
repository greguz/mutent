# Context

The [Mutation](./mutation.md) Context is an object that holds all the information associated with the current Mutation.

## Properties

### `adapter`

Type: [`<Adapter>`](./adapter.md)

The configured Adapter instance at Store's level.

### `intent`

Type: `<string>`

Indicates which [Store](./store.md)'s method was used to create the Mutation. Can be `"CREATE"`, `"FIND"`, `"FILTER"`, `"READ"`, or `"FROM"`.

### `argument`

Type: `<*>`

It holds the **raw** argument passed to the used [Store](./store.md)'s method that have created the Mutation.

### `multiple`

Type: `<boolean>`

It's `true` when multiple Entities could be handled by the current Mutation.

### `options`

Type: `<Object>`

The raw option object passed to the [Mutation](./mutation.md)'s method that triggered the write actions.

### `commitMode`

Type: `<string>`

Configured Commit Mode used by the current Mutation.

### `hooks`

Type: `<Object>`

Configured Hooks object used by the current Mutation.

### `mutators`

Type: [`<Mutator[]>`](./mutator.md)

Configured Mutators used by the current Mutation.

### `writeMode`

Type: `<string>`

Configured Write Mode used by the current Mutation.

### `writeSize`

Type: `<number>`

Configured Write Size used by the current Mutation.

## Example

```javascript
const context = {
  // Store's adapter.
  adapter: { ... },
  // Store method's arguent that has generated the current mutation.
  argument: {},
  // Configured commit mode.
  commitMode: "AUTO",
  // Normalized hooks object.
  hooks: {
    onFind: [],
    onFilter: [],
    onEntity: [],
    beforeCreate: [],
    beforeUpdate: [],
    beforeDelete: [],
    afterCreate: [],
    afterUpdate: [],
    afterDelete: []
  },
  // Mutation's intent (can be "CREATE", "FIND", "READ", "FILTER" and "FROM").
  intent: "CREATE",
  // Indicates if the current mutation could process multiple values.
  multiple: false,
  //
  mutators: [],
  // Adapter's options provided while unwrapping.
  options: {},
  // Configured write mode.
  writeMode: "AUTO",
  // Configured write side.
  writeSize: 16
}
```
