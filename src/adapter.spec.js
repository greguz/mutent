import test from 'ava'

import {
  adapterCreate,
  adapterDelete,
  adapterUpdate,
  bulkWrite,
  concurrentWrite
} from './adapter'
import {
  commitStatus,
  createStatus,
  deleteStatus,
  readStatus,
  updateStatus
} from './status'

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

test('adapter:create', async t => {
  t.plan(7)

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
      beforeCreate (data, options) {
        t.is(data, 'CREATE')
        t.deepEqual(options, { my: 'option' })
      },
      afterCreate (data, options) {
        t.is(data, 'create')
        t.deepEqual(options, { my: 'option' })
      }
    }
  }

  const status = await adapterCreate(context, createStatus('CREATE'), {
    my: 'option'
  })

  t.deepEqual(status, {
    created: false,
    updated: false,
    deleted: false,
    source: 'create',
    target: 'create'
  })
})

test('adapter:update', async t => {
  t.plan(10)

  const context = {
    adapter: {
      ...defaultAdapter,
      update (source, target, options) {
        t.is(source, '')
        t.is(target, 'UPDATE')
        t.deepEqual(options, { my: 'option' })
        return target.toLowerCase()
      }
    },
    hooks: {
      beforeUpdate (oldData, newData, options) {
        t.is(oldData, '')
        t.is(newData, 'UPDATE')
        t.deepEqual(options, { my: 'option' })
      },
      afterUpdate (oldData, newData, options) {
        t.is(oldData, '')
        t.is(newData, 'update')
        t.deepEqual(options, { my: 'option' })
      }
    }
  }

  const status = await adapterUpdate(
    context,
    updateStatus(readStatus(''), 'UPDATE'),
    { my: 'option' }
  )

  t.deepEqual(status, {
    created: false,
    updated: false,
    deleted: false,
    source: 'update',
    target: 'update'
  })
})

test('adapter:delete', async t => {
  t.plan(7)

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
      beforeDelete (data, options) {
        t.is(data, 'DELETE')
        t.deepEqual(options, { my: 'option' })
      },
      afterDelete (data, options) {
        t.is(data, 'DELETE')
        t.deepEqual(options, { my: 'option' })
      }
    }
  }

  const status = await adapterDelete(
    context,
    deleteStatus(updateStatus(readStatus('DELETE'), 'UPDATE')),
    { my: 'option' }
  )

  t.deepEqual(status, {
    created: false,
    updated: false,
    deleted: false,
    source: null,
    target: 'UPDATE'
  })
})

test('adapter:bulk', async t => {
  t.plan(10)

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
      beforeBulk (actions, options) {
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
      },
      afterBulk (actions, options) {
        t.deepEqual(actions, [
          {
            type: 'CREATE',
            data: 'Al'
          },
          {
            type: 'UPDATE',
            oldData: '',
            newData: 'John'
          },
          {
            type: 'DELETE',
            data: 'Giacomo'
          }
        ])
        t.deepEqual(options, { my: 'option' })
      }
    },
    writeSize: 3
  }

  const iterable = [
    createStatus('Aldo'),
    updateStatus(readStatus(''), 'Giovanni'),
    deleteStatus(readStatus('Giacomo'))
  ]

  const options = { my: 'option' }

  const iterator = bulkWrite(context, iterable, options)[Symbol.asyncIterator]()

  const a = await iterator.next()
  t.deepEqual(a, {
    done: false,
    value: readStatus('Al')
  })

  const b = await iterator.next()
  t.deepEqual(b, {
    done: false,
    value: readStatus('John')
  })

  const c = await iterator.next()
  t.deepEqual(c, {
    done: false,
    value: {
      created: false,
      updated: false,
      deleted: false,
      source: null,
      target: 'Giacomo'
    }
  })

  const end = await iterator.next()
  t.deepEqual(end, {
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
    hooks: {},
    writeSize: 2
  }

  const iterable = [
    createStatus('CREATE'),
    updateStatus(readStatus(''), 'UPDATE'),
    // full flush
    readStatus('READ'),
    // skip
    deleteStatus(readStatus('DELETE'))
    // partial flush
  ]

  const options = { my: 'option' }

  const iterator = bulkWrite(context, iterable, options)[Symbol.asyncIterator]()

  const a = await iterator.next()
  t.deepEqual(a, {
    done: false,
    value: commitStatus(iterable[0])
  })

  const b = await iterator.next()
  t.deepEqual(b, {
    done: false,
    value: commitStatus(iterable[1])
  })

  const c = await iterator.next()
  t.deepEqual(c, {
    done: false,
    value: commitStatus(iterable[2])
  })

  const d = await iterator.next()
  t.deepEqual(d, {
    done: false,
    value: commitStatus(iterable[3])
  })

  const end = await iterator.next()
  t.deepEqual(end, {
    done: true,
    value: undefined
  })
})

test('adapter:concurrent', async t => {
  t.plan(12)

  let concurrency = 0

  const context = {
    adapter: {
      create (data) {
        t.is(concurrency, data === 'E' ? 1 : 2)
      }
    },
    hooks: {
      beforeCreate () {
        concurrency++
      },
      afterCreate () {
        concurrency--
      }
    },
    writeSize: 2
  }

  const iterable = [
    createStatus('A'),
    createStatus('B'),
    createStatus('C'),
    createStatus('D'),
    createStatus('E')
  ]

  const options = {}

  const iterator = concurrentWrite(context, iterable, options)

  t.throwsAsync(
    () => concurrentWrite(context, iterable, { mutent: { writeSize: 0 } }).next()
  )

  t.deepEqual(await iterator.next(), {
    done: false,
    value: readStatus('A')
  })
  t.deepEqual(await iterator.next(), {
    done: false,
    value: readStatus('B')
  })
  t.deepEqual(await iterator.next(), {
    done: false,
    value: readStatus('C')
  })
  t.deepEqual(await iterator.next(), {
    done: false,
    value: readStatus('D')
  })
  t.deepEqual(await iterator.next(), {
    done: false,
    value: readStatus('E')
  })
  t.deepEqual(await iterator.next(), {
    done: true,
    value: undefined
  })
})
