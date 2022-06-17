# Mutation

### **Mutation#assign(...objects)**

- `...objects` `<Object>`
- Returns: `<Mutation>`

### **Mutation#consume([options])**

- `options` `<Object>`
- Returns: `<Promise>`

### **Mutation#commit()**

- Returns: `<Mutation>`

### **Mutation#delete()**

- Returns: `<Mutation>`

### **Mutation#filter(predicate)**

- `predicate` `<Function>`
- Returns: `<Mutation>`

### **Mutation#if(condition, whenTrue[, whenFalse])**

- `condition` `<Boolean>` | `<Function>`
- `whenTrue` [`<Mutator>`](mutator.md)
- `whenFalse` [`<Mutator>`](mutator.md)
- Returns: `<Mutation>`

### **Mutation#iterate([options])**

- `options` `<Object>`
- Returns: `<AsyncIterable>`

### **Mutation#pipe(...mutators)**

- `...mutators` [`<Mutator>`](mutator.md)
- Returns: `<Mutation>`

### **Mutation#tap(callback)**

- `callback` `<Function>`
- Returns: `<Mutation>`

### **Mutation#unwrap([options])**

- `options` `<Object>`
- Returns: `<Promise>`

### **Mutation#update(mapper)**

- `mapper` `<Function>`
- Returns: `<Mutation>`
