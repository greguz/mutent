import test from 'ava'

import { adapterCount, adapterExists, writeStatus } from './adapter'
import {
  commitStatus,
  createStatus,
  deleteStatus,
  updateStatus
} from './status'

function write(status, adapter = {}, options = {}) {
  return writeStatus(adapter, status, options)
}

test('reader:count', async t => {
  const adapter = {
    count(query, options) {
      t.deepEqual(query, { imma: 'query' })
      t.deepEqual(options, { imma: 'options' })
      return 42
    }
  }
  t.is(await adapterCount(adapter, { imma: 'query' }, { imma: 'options' }), 42)

  await t.throwsAsync(adapterCount({}), {
    code: 'EMUT_EXPECTED_DRIVER_METHOD'
  })
})

test('reader:exists', async t => {
  const a = {
    exists(query, options) {
      t.deepEqual(query, { imma: 'query' })
      t.deepEqual(options, { imma: 'options' })
      return true
    }
  }
  t.true(await adapterExists(a, { imma: 'query' }, { imma: 'options' }))

  const b = {
    find(query, options) {
      t.deepEqual(query, { imma: 'query' })
      t.deepEqual(options, { imma: 'options' })
      return { a: 'document' }
    }
  }
  t.true(await adapterExists(b, { imma: 'query' }, { imma: 'options' }))

  await t.throwsAsync(adapterExists({}), {
    code: 'EMUT_EXPECTED_DRIVER_METHOD'
  })
})

function sCreate(id) {
  return createStatus({ id })
}

function sVoid(id) {
  return commitStatus(sCreate(id))
}

function sUpdate(id, value) {
  return updateStatus(sVoid(id), { id, value })
}

function sDelete(id) {
  return deleteStatus(sVoid(id))
}

function sCreateUpdate(id, value) {
  return updateStatus(sCreate(id), { id, value })
}

function sCreateDelete(id) {
  return deleteStatus(sCreate(id))
}

function sUpdateDelete(id, value) {
  return deleteStatus(sUpdate(id, value))
}

function sCreateUpdateDelete(id, value) {
  return deleteStatus(sCreateUpdate(id, value))
}

test('sCreate', async t => {
  t.plan(3)

  const writer = {
    create(data, options) {
      t.deepEqual(data, {
        id: 0
      })
      t.deepEqual(options, {
        hello: 'world'
      })
      return {
        ...data,
        id: data.id + 1
      }
    },
    update() {
      t.fail()
    },
    delete() {
      t.fail()
    }
  }

  const status = await write(sCreate(0), writer, { hello: 'world' })

  t.deepEqual(status, {
    created: false,
    updated: false,
    deleted: false,
    source: {
      id: 1
    },
    target: {
      id: 1
    }
  })
})

test('sVoid', async t => {
  t.plan(2)

  const writer = {
    create() {
      t.fail()
    },
    update() {
      t.fail()
    },
    delete() {
      t.fail()
    }
  }

  const status = await write(sVoid(0), writer, { hello: 'world' })

  t.deepEqual(status, await write(sVoid(0), {}))

  t.deepEqual(status, {
    created: false,
    updated: false,
    deleted: false,
    source: {
      id: 0
    },
    target: {
      id: 0
    }
  })
})

test('sUpdate', async t => {
  t.plan(4)

  const writer = {
    create() {
      t.fail()
    },
    update(source, target, options) {
      t.deepEqual(source, {
        id: 0
      })
      t.deepEqual(target, {
        id: 0,
        value: 'UPDATE'
      })
      t.deepEqual(options, {
        hello: 'world'
      })
      return {
        ...target,
        id: target.id + 1
      }
    },
    delete() {
      t.fail()
    }
  }

  const status = await write(sUpdate(0, 'UPDATE'), writer, {
    hello: 'world'
  })

  t.deepEqual(status, {
    created: false,
    updated: false,
    deleted: false,
    source: {
      id: 1,
      value: 'UPDATE'
    },
    target: {
      id: 1,
      value: 'UPDATE'
    }
  })
})

test('sDelete', async t => {
  t.plan(3)

  const writer = {
    create() {
      t.fail()
    },
    update() {
      t.fail()
    },
    delete(data, options) {
      t.deepEqual(data, {
        id: 0
      })
      t.deepEqual(options, {
        hello: 'world'
      })
    }
  }

  const status = await write(sDelete(0), writer, { hello: 'world' })

  t.deepEqual(status, {
    created: false,
    updated: false,
    deleted: false,
    source: null,
    target: {
      id: 0
    }
  })
})

test('sCreateUpdate', async t => {
  t.plan(3)

  const writer = {
    create(data, options) {
      t.deepEqual(data, {
        id: 0,
        value: 'UPDATE'
      })
      t.deepEqual(options, {
        hello: 'world'
      })
    },
    update() {
      t.fail()
    },
    delete() {
      t.fail()
    }
  }

  const status = await write(sCreateUpdate(0, 'UPDATE'), writer, {
    hello: 'world'
  })

  t.deepEqual(status, {
    created: false,
    updated: false,
    deleted: false,
    source: {
      id: 0,
      value: 'UPDATE'
    },
    target: {
      id: 0,
      value: 'UPDATE'
    }
  })
})

test('sCreateDelete', async t => {
  t.plan(1)

  const writer = {
    create() {
      t.fail()
    },
    update() {
      t.fail()
    },
    delete() {
      t.fail()
    }
  }

  const status = await write(sCreateDelete(0), writer, {
    hello: 'world'
  })

  t.deepEqual(status, {
    created: false,
    updated: false,
    deleted: false,
    source: null,
    target: {
      id: 0
    }
  })
})

test('sUpdateDelete', async t => {
  t.plan(3)

  const writer = {
    create() {
      t.fail()
    },
    update() {
      t.fail()
    },
    delete(source, options) {
      t.deepEqual(source, {
        id: 0
      })
      t.deepEqual(options, {
        hello: 'world'
      })
    }
  }

  const status = await write(sUpdateDelete(0, 'UPDATE'), writer, {
    hello: 'world'
  })

  t.deepEqual(status, {
    created: false,
    updated: false,
    deleted: false,
    source: null,
    target: {
      id: 0,
      value: 'UPDATE'
    }
  })
})

test('sCreateUpdateDelete', async t => {
  t.plan(1)

  const writer = {
    create() {
      t.fail()
    },
    update() {
      t.fail()
    },
    delete() {
      t.fail()
    }
  }

  const status = await write(sCreateUpdateDelete(0, 'UPDATE'), writer, {
    hello: 'world'
  })

  t.deepEqual(status, {
    created: false,
    updated: false,
    deleted: false,
    source: null,
    target: {
      id: 0,
      value: 'UPDATE'
    }
  })
})

test('writer defaults', async t => {
  const driver = {}
  await t.throwsAsync(write(sCreate(0), driver), {
    code: 'EMUT_EXPECTED_DRIVER_METHOD'
  })
  await t.throwsAsync(write(sUpdate(0, 'UPDATE'), driver), {
    code: 'EMUT_EXPECTED_DRIVER_METHOD'
  })
  await t.throwsAsync(write(sDelete(0), driver), {
    code: 'EMUT_EXPECTED_DRIVER_METHOD'
  })
})