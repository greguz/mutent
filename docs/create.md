# create(one[, driver])

Declares an _entity_ currently not persisted anywhere.

- `one` `<*>`
- `driver` `<Object>` | `<Function>`
- Returns: `<Entity>`

## One

```javascript
const mutent = require('mutent')

// Provide data directly
const a = mutent.create({
  id: 0,
  name: 'Huey'
})

// Use sync function
const b = mutent.create(options => ({
  id: 1,
  name: 'Dewey'
}))

// Use async function (Promise support)
const c = mutent.create(async options => ({
  id: 2,
  name: 'Louie'
}))
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
  .create('The Universe', driver)
  // Require data source write
  .commit()
  // Execute and expose
  .unwrap({ some: 'options' })
  // Handle errors (Promise)
  .catch(err => console.error(err))

// Will log 'Creating The Universe'
```
