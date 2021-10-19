# Entity

## Static methods

### **Entity.create(data)**

Declares an entity that is still not persisted (needs to be created).

- `data` `<*>`
- Returns: `<Entity>`

### **Entity.read(data)**

Declares an entity that is persisted (read from the persistence layer).

- `data` `<*>`
- Returns: `<Entity>`

## Instance methods

### **Entity#commit()**

Set the entity's status as persisted.

- Returns: `<Entity>`

### **Entity#delete()**

Flags the entity as to be deleted.

- Returns: `<Entity>`

### **Entity#set(data)**

Set the current entity's value without changing its status (no flagging).

- `data` `<*>`
- Returns: `<Entity>`

### **Entity#update(data)**

Updates the current entity's value and flags the entity as to be updated.

- `data` `<*>`
- Returns: `<Entity>`

### **Entity#valueOf()**

Returns the raw entity's value.

- Returns: `<*>`
