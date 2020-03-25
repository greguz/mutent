# find(many[, driver])

Declares a collection of _entities_ actually persisted somewhere.

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
  async update (source, target, options) {
    console.log(`Updating ${source} to ${target}`)
  }
}

mutent
  // Declare entities
  .find(
    [
      'Goku',
      'Vegeta'
    ],
    driver
  )
  // Describe mutation
  .update(data => data + ' Super Saiyan')
  // Require data source write
  .commit()
  // Execute and expose
  .unwrap({ some: 'options' })
  // Handle errors (Promise)
  .catch(err => console.error(err))

// Will log:
// Updating Goku to Goku SuperSaiyan
// Updating Vegeta to Vegeta SuperSaiyan
```
