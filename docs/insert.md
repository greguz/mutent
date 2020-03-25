# insert(many[, driver])

Declares a collection of _entities_ currently not persisted anywhere.

- `many` `<Function>` | `<Readable>` | `<*[]>`
- `driver` `<Object>` | `<Function>`
- Returns: `<Entities>`

## Many

```javascript
const mutent = require('mutent')
const { Readable } = require('stream')

// Provide data directly
mutent.find([])

// Wrap inside a function
mutent.find(options => [])

// Promise support
mutent.find(async options => [])

// Streaming support
mutent.find(new Readable())
mutent.find(options => new Readable())
```

## Driver

See [driver](./driver.md).

## Example

```javascript
const mutent = require('mutent')

const driver = {
  async create (target, options) {
    console.log('Creating ' + target)
  }
}

mutent
  // Declare entity
  .insert(
    [
      'Water Tribe',
      'Earth Kingdom',
      'Fire Nation',
      'Air Nomads'
    ],
    driver
  )
  // Require data source write
  .commit()
  // Execute and expose
  .unwrap({ some: 'options' })
  // Handle errors (Promise)
  .catch(err => console.error(err))

// Will log:
// Creating Water Tribe
// Creating Earth Kingdom
// Creating Fire Nation
// Creating Air Nomads
```
