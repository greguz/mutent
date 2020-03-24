# update(mutator, ...args)

Describe a mutation that will be applied to entity's data. `mutator` function accepts entity's data as first argument and returns the updated one.

- `mutator` `<Function>`
  - `data` `<*>`
  - Returns: `<*>`
- `args` `<...*>` Those args are passed to `mutator` starting from the second argument
- Returns: `<Entity>`

## Example

```javascript
const mutent = require('mutent')

function divide (dividend, divisor) {
  return dividend / divisor
}

mutent
  // Declare entity
  .read(21)
  // Describe first mutation
  .update(value => value * 4)
  // Describe second mutation
  .update(divide, 2)
  // Execute and expose
  .unwrap()
  // Handle Promise
  .then(result => console.log(result)) // Logs '42'
  .catch(err => console.error(err))
```
