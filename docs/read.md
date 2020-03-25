# read(one[, driver])

Declares an _entity_ actually persisted somewhere.

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
  async update (source, target, options) {
    console.log(`Updating ${source} to ${target}`)
  }
}

mutent
  // Declare entity
  .read('iPhone 11s', driver)
  // Describe mutation
  .update(data => data + ' Pro')
  // Require data source write
  .commit()
  // Execute and expose
  .unwrap({ some: 'options' })
  // Handle errors (Promise)
  .catch(err => console.error(err))

// Will log 'Updating iPhone 11 to iPhone 11 Pro'
```
