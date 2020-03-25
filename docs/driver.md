# Driver

A driver is an abstract way to define all the possible write actions to perform against a data source. Possible actions are `create`, `update` and `delete`. There are two methods to define a driver, by using a single function, or a more readable object definition.

## Object

This is the preferred way to write a driver. You can optionally specify any of the three actions as separated functions.

### create(target, options)

Called when It's required to create a new entity.

- `target` `<*>`
- `options` `<Object>`
- Returns: `<Promise>` | `<*>`

### update(source, target, options)

Called when It's required to update a new entity.

`source` represents the original form when the entity's data was fetched from its data source, and `target` represents the final form after all configured mutations are applied to `source`.

- `source` `<*>`
- `target` `<*>`
- `options` `<Object>`
- Returns: `<Promise>` | `<*>`

Tip: You can diff `source` and `target` to understand what was changed and perform an optimized update accordingly.

### delete(source, options)

Called when It's required to delete a new entity.

- `source` `<*>`
- `options` `<Object>`
- Returns: `<Promise>` | `<*>`

### Example

```javascript
const mutent = require('mutent')

const driver = {
  async create (target, options) {
    console.log(`Creating ${target}`)
    if (options.panic) {
      console.log('Carry a towel')
    }
  },
  async update (source, target, options) {
    console.log(`Updating ${source} to ${target}`)
    if (options.panic) {
      console.log('Carry a towel')
    }
  },
  async delete (source, options) {
    console.log(`Deleting ${source}`)
    if (options.panic) {
      console.log('Carry a towel')
    }
  }
}

mutent
  // { source: null, target: 'Smith' }
  .create('Smith', driver)
  // { source: null, target: 'SMITH' }
  .update(data => data.toUpperCase())
  .commit()
  .unwrap()
  .catch(err => console.error(err))
  // Will log 'Creating SMITH'

mutent
  // { source: 'Johnson', target: 'Johnson' }
  .read('Johnson', driver)
  // { source: 'Johnson', target: 'JOHNSON' }
  .update(data => data.toUpperCase())
  .commit()
  .unwrap()
  .catch(err => console.error(err))
  // Will log 'Updating Johnson to JOHNSON'

mutent
  // { source: 'Williams', target: 'Williams' }
  .read('Williams', driver)
  // { source: 'Williams', target: null }
  .delete()
  .commit()
  .unwrap({ panic: true })
  .catch(err => console.error(err))
  // Will log 'Deleting Williams' and 'Carry a towel'

mutent
  // { source: null, target: 'Brown' }
  .create('Brown', driver)
  // { source: null, target: 'BROWN' }
  .update(data => data.toUpperCase())
  // { source: null, target: null }
  .delete()
  .commit()
  .unwrap()
  .catch(err => console.error(err))
  // Will log nothing
```

## commit(source, target, options)

Driver as a single function.

`source` represents the original form when the entity's data was fetched from its data source, and `target` represents the final form after all configured mutations are applied to `source`.

Here, `null` values defines the way you have to handle the data. A nulled `source` defines an entity not persisted on any data source. A nulled `target` defines an entity that must be deleted from its data source.

- `source` `<*>` | `<null>`
- `target` `<*>` | `<null>`
- `options` `<Object>`
- Returns: `<Promise>` | `<*>`

### Example


```javascript
const mutent = require('mutent')

function driver (source, target, options = {}) {
  if (source === null) {
    console.log(`Creating ${target}`)
  } else if (target === null) {
    console.log(`Deleting ${source}`)
  } else {
    console.log(`Updating ${source} to ${target}`)
  }

  if (options.panic) {
    console.log('Carry a towel')
  }
}

mutent
  // { source: null, target: 'Smith' }
  .create('Smith', driver)
  // { source: null, target: 'SMITH' }
  .update(data => data.toUpperCase())
  .commit()
  .unwrap()
  .catch(err => console.error(err))
  // Will log 'Creating SMITH'

mutent
  // { source: 'Johnson', target: 'Johnson' }
  .read('Johnson', driver)
  // { source: 'Johnson', target: 'JOHNSON' }
  .update(data => data.toUpperCase())
  .commit()
  .unwrap()
  .catch(err => console.error(err))
  // Will log 'Updating Johnson to JOHNSON'

mutent
  // { source: 'Williams', target: 'Williams' }
  .read('Williams', driver)
  // { source: 'Williams', target: null }
  .delete()
  .commit()
  .unwrap({ panic: true })
  .catch(err => console.error(err))
  // Will log 'Deleting Williams' and 'Carry a towel'

mutent
  // { source: null, target: 'Brown' }
  .create('Brown', driver)
  // { source: null, target: 'BROWN' }
  .update(data => data.toUpperCase())
  // { source: null, target: null }
  .delete()
  .commit()
  .unwrap()
  .catch(err => console.error(err))
  // Will log nothing
```
