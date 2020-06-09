# Routine

A routine defines an alternative method for updating an entity.

Calling the `run` method, and giving the routine's name as this first argument, will execute the routing. Similarly to mutators, a routine function accepts the entity data as the first argument and returns a fully updated entity. All arguments passed while calling the run method are available as well inside the routing function. The last argument is the current unwrap options.

## Example

```javascript
const { createStore } = require('mutent')

const store = createStore({
  reader: { ... },
  routines: {
    customSet (data, field, value, options) {
      if (options.log) {
        console.log(`Setting field ${field} to ${value}`)
      }
      return {
        ...data,
        [field]: value
      }
    }
  }
})

store
  .read('steven')
  .run('customSet', 'hello', 'world')
  .unwrap({ log: true })
  .catch(err => console.error(err))

// Will log 'Setting field hello to world'
```
