# delete()

Describe entity deletion by applying a `null` mutation.

- Returns: `<Entity>`

## Example

```javascript
const mutent = require('mutent')

mutent
  // Declare entity
  .read({ id: "42" })
  // Describe mutation
  .delete()
  // Execute and expose
  .unwrap()
  // Handle Promise
  .then(result => console.log(result)) // Logs 'null'
  .catch(err => console.error(err))
```

Since `delete` method just performs a `null` mutation, you can also use the [update](./update.md) method to achieve the same result.

```javascript
const mutent = require('mutent')

mutent
  // Declare entity
  .read({ id: "42" })
  // Describe mutation
  .update(() => null)
  // Execute and expose
  .unwrap()
  // Handle Promise
  .then(result => console.log(result)) // Logs 'null'
  .catch(err => console.error(err))
```
