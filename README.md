# mutent

```javascript
const mutent = require("mutent");

async function commit(source, target, options) {
  if (source === null && target === null) {
    console.log("void");
  } else if (source === null) {
    console.log("create", target);
  } else if (target === null) {
    console.log("delete", source);
  } else {
    console.log("update", source, target);
  }
}

async function procedure() {
  // create entity (commit function have to return a Promise)
  const e0 = mutent.create({ a: 1 }, commit);

  // create commit
  // log "create { a: 1 }"
  const e1 = await e0.commit();

  const e2 = e1.update(data => ({ ...data, b: true }));
  const e3 = e2.update(data => ({ ...data, c: "Hello World" }));

  // update commit (with commit options)
  // log "update { a: 1 } { a: 1, b: true, c: 'Hello World' }"
  const e4 = await e3.commit({
    db: "my-db",
    collection: "entities"
  });

  const e5 = e4.delete();

  // delete commit
  // log "delete { a: 1, b: true, c: 'Hello World' }"
  const e6 = await e5.commit();

  // void commit (with fluent API)
  // log "void"
  const dead = await mutent
    .create({}, commit)
    .update(data => ({ ...data, value: "bye bye" }))
    .delete()
    .commit();

  // read entity
  const r0 = mutent.read({ value: 10 }, commit);
  const r1 = r0.update(data => ({ ...data, value: -10 }));

  // update commit
  // log "update { value: 10 } { value: -10 }"
  const r2 = await r1.commit();

  // error "This entity is immutable"
  e2.update(data => data);
}

procedure();
```
