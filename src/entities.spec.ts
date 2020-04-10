import test, { ExecutionContext } from 'ava'
import { pipeline, Readable, Writable } from 'readable-stream'

import { findEntities, insertEntities } from './entities'
import { Driver } from './handler'

interface Item {
  value: number
  num?: number
}

interface CommitMode {
  create?: boolean
  update?: boolean
  delete?: boolean
}

function bind (t: ExecutionContext, mode: Partial<CommitMode> = {}): Driver<Item> {
  return {
    async create (target, options) {
      if (mode.create === true) {
        t.pass()
      } else {
        t.fail()
      }
      t.deepEqual(options, { db: 'test' })
    },
    async update (source, target, options) {
      if (mode.update === true) {
        t.pass()
      } else {
        t.fail()
      }
      t.deepEqual(options, { db: 'test' })
    },
    async delete (source, options) {
      if (mode.delete === true) {
        t.pass()
      } else {
        t.fail()
      }
      t.deepEqual(options, { db: 'test' })
    }
  }
}

function getItems (count: number = 16) {
  const items: Item[] = []
  for (let i = 0; i < count; i++) {
    items.push({ value: i * 2 })
  }
  return items
}

test('lock', async t => {
  t.throws(() => {
    const entities = insertEntities([])
    entities.update(data => data)
    entities.update(data => data)
  })
  t.throws(() => {
    const entities = insertEntities([])
    entities.assign({})
    entities.assign({})
  })
  t.throws(() => {
    const entities = insertEntities([])
    entities.delete()
    entities.delete()
  })
  t.throws(() => {
    const entities = insertEntities([])
    entities.commit()
    entities.commit()
  })
  await t.throwsAsync(async () => {
    const entities = insertEntities([])
    await entities.unwrap()
    await entities.unwrap()
  })
})

test('create', async t => {
  t.plan(35)
  const results = await insertEntities(getItems(), bind(t, { create: true }))
    .commit()
    .unwrap({ db: 'test' })
  t.is(results.length, 16)
  t.is(results[0].value, 0)
  t.is(results[15].value, 30)
})

test('update', async t => {
  t.plan(35)
  const results = await findEntities(getItems(), bind(t, { update: true }))
    .update(data => ({ value: data.value / 2 }))
    .commit()
    .unwrap({ db: 'test' })
  t.is(results.length, 16)
  t.is(results[0].value, 0)
  t.is(results[15].value, 15)
})

test('assign', async t => {
  t.plan(37)
  const results = await findEntities(getItems(), bind(t, { update: true }))
    .assign({ num: 42 })
    .commit()
    .unwrap({ db: 'test' })
  t.is(results.length, 16)
  t.is(results[0].value, 0)
  t.is(results[0].num, 42)
  t.is(results[15].value, 30)
  t.is(results[15].num, 42)
})

test('delete', async t => {
  t.plan(35)
  const results = await findEntities(getItems(), bind(t, { delete: true }))
    .delete()
    .commit()
    .unwrap({ db: 'test' })
  t.is(results.length, 16)
  t.is(results[0].value, 0)
  t.is(results[15].value, 30)
})

test('insert-error', async t => {
  await t.throwsAsync(async () => {
    await insertEntities([1])
      .update(async () => { throw new Error('TEST') })
      .unwrap()
  })
})

test('stream', async t => {
  t.plan(48)
  await new Promise((resolve, reject) => {
    let index = 0
    pipeline(
      insertEntities(getItems(), bind(t, { create: true }))
        .commit()
        .stream({ db: 'test' }),
      new Writable({
        objectMode: true,
        write (data: Item, encoding, callback) {
          t.is(data.value, index++ * 2)
          callback()
        }
      }),
      err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      }
    )
  })
})

test('stream-error', async t => {
  function getErroredStream (err: any) {
    return new Readable({
      read () {
        this.emit('error', err)
      }
    })
  }

  await t.throwsAsync(async () => {
    await new Promise((resolve, reject) => {
      pipeline(
        insertEntities(getErroredStream(new Error())).stream(),
        new Writable({
          objectMode: true,
          write (chunk, encoding, callback) {
            callback()
          }
        }),
        err => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      )
    })
  })
})

test('undo entitites', async t => {
  t.plan(3)
  const results = await findEntities(getItems())
    .update(data => ({ value: data.value * -1 }))
    .update(data => ({ value: data.value * 2 }))
    .delete()
    .undo(2)
    .unwrap({ db: 'test' })
  t.is(results.length, 16)
  t.is(results[0].value, -0)
  t.is(results[15].value, -30)
})

test('redo entitites', async t => {
  t.plan(3)
  const results = await findEntities(getItems())
    .update(data => ({ value: data.value * -1 }))
    .update(data => ({ value: data.value * 2 }))
    .update(data => ({ value: data.value * 10 }))
    .undo(2)
    .redo(2)
    .unwrap()
  t.is(results.length, 16)
  t.is(results[0].value, -0)
  t.is(results[15].value, -600)
})
