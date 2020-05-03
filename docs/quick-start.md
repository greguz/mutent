# Quick Start

## Reader

```javascript
function createReader (array, matcher) {
  return {
    find (query) {
      return array.find(item => matcher(item, query))
    },
    filter (query) {
      return array.filter(item => matcher(item, query))
    }
  }
}
```

## Writer

```javascript
function createWriter (array) {
  return {
    create (data) {
      array.push(data)
    },
    update (source, target) {
      array.splice(
        array.findIndex(item => item === source),
        1,
        target
      )
    },
    delete (data) {
      array.splice(
        array.findIndex(item => item === data),
        1
      )
    }
  }
}
```

## Store

```javascript
const { createStore } = require('mutent')

const database = []

function matcher (item, query) {
  return query instanceof RegExp
    ? query.test(item.name)
    : item.name === query
}

const store = createStore({
  autoCommit: true,
  classy: false,
  historySize: 10,
  safe: true,
  reader: createReader(database, matcher),
  writer: createWriter(database)
})
```

## Entity

### Create

```javascript
const createdEntity = await store
  .create({ name: 'steven' })
  .upwrap()
```

### Read

```javascript
const readEntity = await store
  .read('steven')
  .upwrap()
```

### Update

```javascript
function setAge (entity, age) {
  return {
    ...entity,
    age
  }
}
```

```javascript
const updatedEntity = await store
  .read('steven')
  .update(setAge, 42)
  .upwrap()
```

```javascript
const updatedEntity = await store
  .from(readEntity)
  .update(setAge, 42)
  .upwrap()
```

### Delete

```javascript
const deletedEntity = await store
  .read('steven')
  .delete()
  .upwrap()
```

```javascript
const deletedEntity = await store
  .from(readEntity)
  .delete()
  .upwrap()
```

## Entities

### Create

```javascript
const createdEntities = await store
  .create([
    { name: 'alice' },
    { name: 'bob' },
    { name: 'charlie' }
  ])
  .unwrap()
```

### Read

```javascript
const readEntities = await store
  .filter(/e$/)
  .unwrap()
```

### Update

```javascript
const updatedEntities = await store
  .filter(/e$/)
  .update(setAge, 42)
  .unwrap()
```

```javascript
const updatedEntities = await store
  .from(readEntities)
  .update(setAge, 42)
  .unwrap()
```

### Delete

```javascript
const deletedEntities = await store
  .filter(/e$/)
  .delete()
  .unwrap()
```

```javascript
const deletedEntities = await store
  .from(readEntities)
  .delete()
  .unwrap()
```

### Stream

```javascript
const deletedEntities = await store
  .read(readEntities)
  .stream()
  .on('data', data => console.log(data))
  .on('error', err => console.error(err))
```
