# Context

The mutator's context contains the configuration of the current mutation.

```javascript
const context = {
  // Store's adapter.
  adapter: {},
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
  // Store's name.
  store: "MyStore",
  // Configured write mode.
  writeMode: "AUTO",
  // Configured write side.
  writeSize: 16
}
```
