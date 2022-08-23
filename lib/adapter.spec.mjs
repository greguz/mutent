import test from 'ava'

import {
  bulkWrite,
  concurrentWrite,
  getAdapterName,
  iterateContext,
  writeEntity
} from './adapter.mjs'
import { Entity } from './entity.mjs'

const defaultAdapter = {
  find () {
    throw new Error('adapter#find')
  },
  filter () {
    throw new Error('adapter#filter')
  },
  create () {
    throw new Error('adapter#create')
  },
  update () {
    throw new Error('adapter#update')
  },
  delete () {
    throw new Error('adapter#delete')
  },
  bulk () {
    throw new Error('adapter#bulk')
  }
}

test('adapter:errors', async t => {
  const adapter = {}

  t.throws(
    () => iterateContext({
      adapter,
      intent: 'FIND'
    }),
    { code: 'EMUR_PARTIAL_ADAPTER' }
  )
  t.throws(
    () => iterateContext({
      adapter,
      intent: 'FILTER'
    }),
    { code: 'EMUR_PARTIAL_ADAPTER' }
  )
  await t.throwsAsync(
    writeEntity(Entity.create('CREATE'), { adapter }),
    { code: 'EMUR_PARTIAL_ADAPTER' }
  )
  await t.throwsAsync(
    writeEntity(Entity.read('READ').update('UPDATE'), { adapter }),
    { code: 'EMUR_PARTIAL_ADAPTER' }
  )
  await t.throwsAsync(
    writeEntity(Entity.read('READ').delete(), { adapter }),
    { code: 'EMUR_PARTIAL_ADAPTER' }
  )
})

test('adapter:create', async t => {
  t.plan(9)

  const context = {
    adapter: {
      ...defaultAdapter,
      create (data, options) {
        t.is(data, 'CREATE')
        t.deepEqual(options, { my: 'option' })
        return data.toLowerCase()
      }
    },
    hooks: {
      beforeCreate: [
        (entity, context) => {
          t.is(entity.valueOf(), 'CREATE')
          t.deepEqual(context.options, { my: 'option' })
        }
      ],
      afterCreate: [
        (entity, context) => {
          t.is(entity.valueOf(), 'create')
          t.deepEqual(context.options, { my: 'option' })
        }
      ]
    },
    options: {
      my: 'option'
    }
  }

  const result = await writeEntity(
    Entity.create('CREATE'),
    context
  )

  t.true(result instanceof Entity)
  t.is(result.source, 'create')
  t.is(result.target, 'create')
})

test('adapter:update', async t => {
  t.plan(12)

  const context = {
    adapter: {
      ...defaultAdapter,
      update (oldData, newData, options) {
        t.is(oldData, '')
        t.is(newData, 'UPDATE')
        t.deepEqual(options, { my: 'option' })
        return newData.toLowerCase()
      }
    },
    hooks: {
      beforeUpdate: [
        (entity, context) => {
          t.is(entity.source, '')
          t.is(entity.target, 'UPDATE')
          t.deepEqual(context.options, { my: 'option' })
        }
      ],
      afterUpdate: [
        (entity, context) => {
          t.is(entity.source, '')
          t.is(entity.target, 'update')
          t.deepEqual(context.options, { my: 'option' })
        }
      ]
    },
    options: {
      my: 'option'
    }
  }

  const result = await writeEntity(
    Entity.read('').update('UPDATE'),
    context
  )

  t.true(result instanceof Entity)
  t.is(result.source, 'update')
  t.is(result.target, 'update')
})

test('adapter:delete', async t => {
  t.plan(9)

  const context = {
    adapter: {
      ...defaultAdapter,
      delete (data, options) {
        t.is(data, 'DELETE')
        t.deepEqual(options, { my: 'option' })
        return data.toLowerCase()
      }
    },
    hooks: {
      beforeDelete: [
        (entity, context) => {
          t.is(entity.source, 'DELETE')
          t.deepEqual(context.options, { my: 'option' })
        }
      ],
      afterDelete: [
        (entity, context) => {
          t.is(entity.source, 'DELETE')
          t.deepEqual(context.options, { my: 'option' })
        }
      ]
    },
    options: {
      my: 'option'
    }
  }

  const result = await writeEntity(
    Entity.read('DELETE').update('UPDATE').delete(),
    context
  )

  t.true(result instanceof Entity)
  t.is(result.source, null)
  t.is(result.target, 'UPDATE')
})

test('adapter:bulk', async t => {
  t.plan(20)

  const context = {
    adapter: {
      ...defaultAdapter,
      bulk (actions, options) {
        t.deepEqual(actions, [
          {
            type: 'CREATE',
            data: 'Aldo'
          },
          {
            type: 'UPDATE',
            oldData: '',
            newData: 'Giovanni'
          },
          {
            type: 'DELETE',
            data: 'Giacomo'
          }
        ])
        t.deepEqual(options, { my: 'option' })
        return ['Al', 'John', 'Jack']
      }
    },
    hooks: {
      beforeCreate: [
        (entity, context) => {
          t.is(entity.target, 'Aldo')
          t.deepEqual(context.options, { my: 'option' })
        }
      ],
      beforeUpdate: [
        (entity, context) => {
          t.is(entity.source, '')
          t.is(entity.target, 'Giovanni')
          t.deepEqual(context.options, { my: 'option' })
        }
      ],
      beforeDelete: [
        (entity, context) => {
          t.is(entity.source, 'Giacomo')
          t.deepEqual(context.options, { my: 'option' })
        }
      ],
      afterCreate: [
        (entity, context) => {
          t.is(entity.target, 'Al')
          t.deepEqual(context.options, { my: 'option' })
        }
      ],
      afterUpdate: [
        (entity, context) => {
          t.is(entity.target, 'John')
          t.deepEqual(context.options, { my: 'option' })
        }
      ],
      afterDelete: [
        (entity, context) => {
          t.is(entity.target, 'Giacomo')
          t.deepEqual(context.options, { my: 'option' })
        }
      ]
    },
    options: {
      my: 'option'
    },
    writeSize: 3
  }

  const iterable = [
    Entity.create('Aldo'),
    Entity.read('').update('Giovanni'),
    Entity.read('Giacomo').delete()
  ]

  const iterator = bulkWrite(iterable, context)[Symbol.asyncIterator]()

  const a = await iterator.next()
  t.deepEqual(a, {
    done: false,
    value: Entity.read('Al')
  })

  const b = await iterator.next()
  t.deepEqual(b, {
    done: false,
    value: Entity.read('John')
  })

  const c = await iterator.next()
  t.is(c.done, false)
  t.is(c.value.valueOf(), 'Giacomo')

  const d = await iterator.next()
  t.deepEqual(d, {
    done: true,
    value: undefined
  })
})

test('adapter:broken-bulk', async t => {
  t.plan(9)

  const context = {
    adapter: {
      ...defaultAdapter,
      bulk (actions, options) {
        t.true(actions.length === 2 || actions.length === 1)
        t.deepEqual(options, { my: 'option' })
      }
    },
    hooks: {
      onFind: [],
      onFilter: [],
      onEntity: [],
      beforeCreate: [],
      beforeUpdate: [],
      beforeDelete: [],
      afterCreate: [],
      afterUpdate: [],
      afterDelete: []
    },
    options: {
      my: 'option'
    },
    writeSize: 2
  }

  const iterable = [
    Entity.create('CREATE'),
    Entity.read('').update('UPDATE'),
    // full flush
    Entity.read('READ'),
    // skip
    Entity.read('DELETE').delete()
    // partial flush
  ]

  const iterator = bulkWrite(iterable, context)[Symbol.asyncIterator]()

  const a = await iterator.next()
  t.deepEqual(a, {
    done: false,
    value: iterable[0].commit()
  })

  const b = await iterator.next()
  t.deepEqual(b, {
    done: false,
    value: iterable[1].commit()
  })

  const c = await iterator.next()
  t.deepEqual(c, {
    done: false,
    value: iterable[2].commit()
  })

  const d = await iterator.next()
  t.deepEqual(d, {
    done: false,
    value: iterable[3].commit()
  })

  const end = await iterator.next()
  t.deepEqual(end, {
    done: true,
    value: undefined
  })
})

test('adapter:concurrent', async t => {
  t.plan(11)

  let concurrency = 0

  const context = {
    adapter: {
      create (data) {
        t.is(concurrency, data === 'E' ? 1 : 2)
      }
    },
    hooks: {
      beforeCreate: [
        () => {
          concurrency++
        }
      ],
      afterCreate: [
        () => {
          concurrency--
        }
      ]
    },
    options: {},
    writeSize: 2
  }

  const iterable = [
    Entity.create('A'),
    Entity.create('B'),
    Entity.create('C'),
    Entity.create('D'),
    Entity.create('E')
  ]

  const iterator = concurrentWrite(iterable, context)

  t.deepEqual(await iterator.next(), {
    done: false,
    value: Entity.read('A')
  })
  t.deepEqual(await iterator.next(), {
    done: false,
    value: Entity.read('B')
  })
  t.deepEqual(await iterator.next(), {
    done: false,
    value: Entity.read('C')
  })
  t.deepEqual(await iterator.next(), {
    done: false,
    value: Entity.read('D')
  })
  t.deepEqual(await iterator.next(), {
    done: false,
    value: Entity.read('E')
  })
  t.deepEqual(await iterator.next(), {
    done: true,
    value: undefined
  })
})

test('adapter:getAdapterName', t => {
  t.is(getAdapterName(), 'Unknown Adapter')
  t.is(getAdapterName(null), 'Unknown Adapter')
  t.is(getAdapterName({}), 'Object')
  t.is(
    getAdapterName({ [Symbol.for('adapter-name')]: 'Custom Adapter' }),
    'Custom Adapter'
  )
})
