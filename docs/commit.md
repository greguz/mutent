# Commit

Committing is the intent to perform a write against a data source. The [Writer](writer.md) defines how a commit operation needs to execute.

A single commit request will always result in a single action between **create**, **update**, and **delete**. In some circumstances, a commit request may be skipped. For example, if an entity is created in memory, and then deleted, there's no need to write that data to its service.

Mutent will optimize all commit requests to gain the best performance possible. Anyway, performing all declared actions is still possible by manually committing when necessary.

```javascript
store
  .create({ name: 'jack' })
  .update(setAge, 26)
  .commit() // Optional if "autoCommit: true"
  .unwrap()
```

The example above will result in a single **create** action with the last version of the entity. The example below will result first in a **create** action, and then in an **update** action.

```javascript
store
  .create({ name: 'jack' })
  .commit()
  .update(setAge, 26)
  .commit()
  .unwrap()
```

Here there's a table with all possible intents and the resulting action performed by Mutent.

| Create | Update | Delete | Action |
| :----: | :----: | :----: | -----: |
| x      |        |        | Create |
|        | x      |        | Update |
|        |        | x      | Delete |
| x      | x      |        | Create |
| x      |        | x      | -      |
|        | x      | x      | Delete |
| x      | x      | x      | -      |
