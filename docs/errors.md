# Errors

## `new MutentError([code], [message], [info])`

A custom error that exposes an error code and an optional info object. This error is used internally but It can be used externally by some plugins or other purposes.

- `[code]` `<string>` Error code. Defaults to `"EMUT_GENERIC_ERROR"`.
- `[message]` `<string>` Error message.
- `[info]` `<Object>` Error details object.
- Returns: `<MutentError>`

```javascript
import { MutentError } from 'mutent'

const err = new MutentError('MY_CODE', 'My message', { my: 'info' })
console.log(err.code) // MY_CODE
console.log(err.message) // My message
console.log(err.info) // { my: 'info' }
console.log(err.stack) // MutentError: My message...
```

## Error Codes

These codes represents all possibile Mutent related errors.

### `EMUT_ENTITY_REQUIRED`

It happens when the Adapter cannot retrieve an Entity during a Read intent.

### `EMUT_MUTATION_OVERFLOW`

It happens when more than one Entity is retrieved, but the current intent (Read or Find) requires one Entity at most.

### `EMUT_PARTIAL_ADAPTER`

It happens when the required Adapter's method to perform the desired action is not defined.

### `EMUT_UNSAFE_UNWRAP`

It happens when the Commit mode is set to `"SAFE"`, and an entity that requires a commit is unwrapped.
