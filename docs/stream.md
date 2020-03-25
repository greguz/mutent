# stream([options])

Access single entities through Readable stream.

- `options` `<Object>`
- Returns: `<Readable>`

## Example

```javascript
const mutent = require('mutent')
const { pipeline, Writable } = require('stream')

pipeline(
  mutent
    // Declare entities
    .find([
      'Alice',
      'Bob',
      'Chuck'
    ])
    // Get readable stream
    .stream({ some: 'options' }),
  // Handle incoming entities
  new Writable({
    objectMode: true,
    write ({ entity, options }, encoding, callback) {
      entity
        .unwrap(options)
        .then(result => console.log(result))
        .then(() => callback())
        .catch(callback)
    }
  }),
  err => {
    if (err) {
      console.error(err)
    }
  }
)

// Will log:
// Alice
// Bob
// Chuck
```
