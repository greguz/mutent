# Store

```javascript
import { Store } from 'mutent'

// Default options
const store = new Store({
  // This is the only mandatory option.
  adapter: new MyAdapter(),
  // Desired commit mode, can be "AUTO", "MANUAL", or "SAFE".
  commitMode: 'AUTO',
  // List of hooks.
  hooks: {},
  // List of custom mutators to apply at the beginning of any mutation.
  mutators: [],
  // Store's name.
  name: 'MyStore',
  // List of plugins to register.
  plugins: [],
  // Desired write mode, can be "AUTO", "SEQUENTIAL", "BULK", or "CONCURRENT".
  writeMode: 'AUTO',
  // Desired write size.
  writeSize: 16
})
```

## Options

### Commit mode

TODO

- `AUTO`: Automatically commit all entities when a mutation is unwrapped.
- `MANUAL`: Commits must be manually declared.
- `SAFE`: Throw an error if an entity has uncommitted changes and It's unwrapped.

### Write mode

TODO

- `SEQUENTIAL`: Do all writes sequentially.
- `BULK`: Lorem Ipsum
- `CONCURRENT`: Lorem Ipsum
- `AUTO`: Automatically choose the best write mode possible.

### Hooks

See [hooks](hooks.md) docs.

### Mutators

TODO

### Plugins

See [plugin](plugin.md) docs.

## Constructor

### **new Store(options)**

- `options` `<Object>`
  - `adapter` `<Adapter>`
  - `[commitMode]` `<String>` Can be `"AUTO"`, `"MANUAL"`, or `"SAFE"`.
  - `[hooks]` `<Hooks>`
  - `[mutators]` `<Mutator[]>`
  - `[name]` `<String>` Store's name.
  - `[plugins]` `<Plugin[]>`
  - `[writeMode]` `<String>` Can be `"AUTO"`, `"SEQUENTIAL"`, `"BULK"`, or `"CONCURRENT"`.
  - `[writeSize]` `<Number>` Must be a positive integer.

## Methods

### **Store#create(data)**

TODO

- `data` `<Object>` | `<Iterable>` | `<AsyncIterable>`
- Returns: [`<Mutation>`](mutation.md)

### **Store#register(plugin)**

Registers a plugin.

- `plugin` `<Plugin>`
- Returns: `<Store>`

### **Store#filter(query)**

TODO

- `query` `<*>`
- Returns: `<Mutation>`

### **Store#find(query)**

TODO

- `query` `<*>`
- Returns: `<Mutation>`

### **Store#from(data)**

TODO

- `data` `<Object>` | `<Iterable>` | `<AsyncIterable>`
- Returns: `<Mutation>`

### **Store#read(query)**

TODO

- `query` `<*>`
- Returns: `<Mutation>`
