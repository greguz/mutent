# unwrap([options])

Fetch required data, applies all described mutations, and expose resulting data through a `Promise`.

- `options` `<Object>`
- Returns: `<Promise>`

## Example

```javascript
const mutent = require('mutent')

async function readFromDataSource (options) {
  return 'Hello'
}

mutent
  // Declare entity
  .read(readFromDataSource)
  // Describe mutation
  .update(data => data + ' World')
  // Execute and expose
  .unwrap()
  // Handle Promise
  .then(result => console.log(result)) // Logs 'Hello World'
  .catch(err => console.error(err))
```
