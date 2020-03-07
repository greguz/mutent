import test, { ExecutionContext } from 'ava'
import { pipeline, Writable } from 'readable-stream'

import { insert, find } from './entities'
import { Entity } from './entity'

interface CommitMode {
  create: boolean
  update: boolean
  delete: boolean
}

function bind (t: ExecutionContext, mode: Partial<CommitMode> = {}) {
  return async (source: any, target: any, options: any) => {
    if (
      (source === null && target === null) ||
      source === undefined ||
      target === undefined
    ) {
      t.fail()
    } else if (source === null) {
      if (mode.create === true) {
        t.pass()
      } else {
        t.fail()
      }
    } else if (target === null) {
      if (mode.delete === true) {
        t.pass()
      } else {
        t.fail()
      }
    } else {
      if (mode.update === true) {
        t.pass()
      } else {
        t.fail()
      }
    }
    t.deepEqual(options, { db: 'test' })
  }
}

interface Item {
  value: number
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
    const entities = insert([])
    entities.update(data => data)
    entities.update(data => data)
  })
  t.throws(() => {
    const entities = insert([])
    entities.assign({})
    entities.assign({})
  })
  t.throws(() => {
    const entities = insert([])
    entities.delete()
    entities.delete()
  })
  t.throws(() => {
    const entities = insert([])
    entities.commit()
    entities.commit()
  })
  await t.throwsAsync(async () => {
    const entities = insert([])
    await entities.unwrap()
    await entities.unwrap()
  })
})

test('create', async t => {
  t.plan(35)
  const results = await insert(getItems(), bind(t, { create: true }))
    .commit()
    .unwrap({ db: 'test' })
  t.is(results.length, 16)
  t.is(results[0].value, 0)
  t.is(results[15].value, 30)
})

test('update', async t => {
  t.plan(35)
  const results = await find(getItems(), bind(t, { update: true }))
    .update(data => ({ value: data.value / 2 }))
    .commit()
    .unwrap({ db: 'test' })
  t.is(results.length, 16)
  t.is(results[0].value, 0)
  t.is(results[15].value, 15)
})

test('assign', async t => {
  t.plan(37)
  const results = await find(getItems(), bind(t, { update: true }))
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
  const results = await find(getItems(), bind(t, { delete: true }))
    .delete()
    .commit()
    .unwrap({ db: 'test' })
  t.is(results.length, 16)
  t.is(results[0], null)
  t.is(results[15], null)
})

test('insert-error', async t => {
  await t.throwsAsync(async () => {
    await insert([1])
      .update(async () => { throw new Error('TEST') })
      .unwrap()
  })
})

test('stream', async t => {
  t.plan(48)
  await new Promise((resolve, reject) => {
    let index = 0
    pipeline(
      insert(getItems(), bind(t, { create: true })).stream(),
      new Writable({
        objectMode: true,
        write (entity: Entity<Item, any>, encoding, callback) {
          entity
            .commit()
            .unwrap({ db: 'test' })
            .then(result => t.is(result.value, index++ * 2))
            .then(() => callback())
            .catch(callback)
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
  await t.throwsAsync(async () => {
    await new Promise((resolve, reject) => {
      pipeline(
        insert((): any => Promise.reject(new Error())).stream(),
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

test('reduce', async t => {
  t.plan(49)
  const result = await insert(getItems(), bind(t, { create: true }))
    .reduce<number>(
      async (accumulator, entity, index, options) => {
        t.pass()
        const data = await entity
          .commit()
          .unwrap(options)
        return accumulator + (data.value / 2)
      },
      0,
      { db: 'test' }
    )
  t.is(result, 120)
})

test('reduce-error', async t => {
  await t.throwsAsync(async () => {
    await insert(getItems()).reduce(() => Promise.reject(new Error()), 0)
  })
})
