# assign(data)

Describe a [Object.assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)-like manipulation.

- `data` `<Object>`
- Returns: `<Entity>`

## Example

```javascript
const mutent = require('mutent')

mutent
  // Declare entity
  .read({ a: 1, b: 2 })
  // Describe mutation
  .assign({ b: 4, c: 5 })
  // Execute and expose
  .unwrap()
  // Handle Promise
  .then(result => console.log(result)) // Logs '{ a: 1, b: 4, c: 5 }'
  .catch(err => console.error(err))
```
