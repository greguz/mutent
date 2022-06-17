# Plugin

A plugin is a set of configuration that can be applied to an existing Mutent's [store](store.md).

- `plugin` `<Object>`
  - `[commitMode]` `<String>` Can be `"AUTO"`, `"MANUAL"`, or `"SAFE"`.
  - `[hooks]` `<Hooks>`
  - `[mutators]` `<Mutator[]>`
  - `[writeMode]` `<String>` Can be `"AUTO"`, `"SEQUENTIAL"`, `"BULK"`, or `"CONCURRENT"`.
  - `[writeSize]` `<Number>` Must be a positive integer.
