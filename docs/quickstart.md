# QuickStart

```javascript
import { Store } from 'mutent'

const store = new Store({
  adapter: myAdapter
})
```

```javascript
const mutation = store.create(data)
```

```javascript
const result = await mutation.unwrap()
```

```javascript
const objectOrNull = await store.find(query).unwrap()
```




a mutation is the set of declared operations to do. To run those operations, the mutation needs to be unwrapped. there are multiple ways to unwrap a mutation. the easiest way is with the `unwrap` method. the unwrap method accepts optionally a set of options for the currently configured adapter.

```javascript
const result = await mutation.unwrap(options)
```

The `unwrap` method will return a `Promise` that will resolve in the touched entities' data.

> Keep in mind that the `unwrap` method can resolve in `null`, in a single entity, or in an array of entities. The output will be defined by the mutation's creation method. See [store]()'s docs for more info.

It is also possibile to iterate a mutation. The method `iterate` will return an `AsyncIterable` that will output all processed entities.

```javascript
const iterable = mutation.iterate(options)

for await (const data of iterable) {
  // do something
}
```

The last method to unwrap a mutation is `consume`. The `consume` method will return a `Promise` that will resolve to the number of touched entites.

```javascript
const count = await mutation.consume(options)
```
