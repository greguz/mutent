# reduce(reducer, initialValue[, options])

Mimics [array.reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce) method.

- `reducer` `<Function>`
  - `accumulator` `<*>`
  - `entity` `<Entity>`
  - `index` `<Number>`
  - `options` `<Object>`
  - Returns: `<Promise>`
- `initialValue` `<*>`
- `options` `<Object>`
- Returns: `<Promise>`

## Example

```javascript
const mutent = require('mutent')

async function reducer (accumulator, entity, index, options) {
  const data = await entity.unwrap(options)
  const status = data.completed ? 'v' : 'x'
  return `${accumulator}\n${status} ${data.title}`
}

mutent
  // Declare entities
  .insert([
    { title: 'Horn of Bicorn', completed: true },
    { title: 'Boomslang skin', completed: true },
    { title: 'Hair of person you\'re turning into', completed: false }
  ])
  // Reduce entities
  .reduce(reducer, 'Polyjuice Potion part 2:', { some: 'option' })
  // Handle promise
  .then(result => console.log(result))
  .catch(err => console.error(err))

// Will log:
// Polyjuice Potion part 2:
// v Horn of Bicorn
// v Boomslang skin
// x Hair of person you're turning into
```
