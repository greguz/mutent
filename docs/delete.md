# delete()

Describe entity deletion by applying a `null` mutation.

- Returns: `<Entity>`

## Example

```javascript
const mutent = require('mutent')

const driver = {
  async delete (source, options) {
    console.log(`Deleting entity ${source.id}`)
  }
}

mutent
  // Declare entity
  .read({ id: 42 }, driver)
  // Describe mutation
  .delete()
  // Require data source write
  .commit()
  // Execute and expose
  .unwrap()
  // Handle Promise
  .then(result => console.log(result))
  .catch(err => console.error(err))

// Will log:
// Deleting entity 42
// null
```

Since `delete` method just performs a `null` mutation, you can also use the [update](./update.md) method to achieve the same result.

```javascript
const mutent = require('mutent')

const driver = {
  async delete (source, options) {
    console.log(`Deleting entity ${source.id}`)
  }
}

mutent
  // Declare entity
  .read({ id: 42 }, driver)
  // Describe mutation
  .update(() => null)
  // Require data source write
  .commit()
  // Execute and expose
  .unwrap()
  // Handle Promise
  .then(result => console.log(result))
  .catch(err => console.error(err))

// Will log:
// Deleting entity 42
// null
```
