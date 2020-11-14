import test from 'ava'

import { createDriver, write } from './driver'
import {
  commitStatus,
  createStatus,
  deleteStatus,
  updateStatus
} from './status'

function find(driver, query, options) {
  return driver.find(query, options)
}

function filter(driver, query, options) {
  return driver.filter(query, options)
}

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

function adapterFind(adapter, query, options = {}) {
  return find(createDriver(adapter), query, options)
}

function adapterFilter(adapter, query, options = {}) {
  return filter(createDriver(adapter), query, options)
}

function writeStatus(status, adapter = {}, options = {}) {
  return write(createDriver(adapter), status, options)
}

test('driver:defaults', async t => {
  const adapter = {}

  t.throws(() => adapterFind(adapter), {
    code: 'EMUT_EXPECTED_ADAPTER_METHOD'
  })
  t.throws(() => adapterFilter(adapter), {
    code: 'EMUT_EXPECTED_ADAPTER_METHOD'
  })

  await t.throwsAsync(() => writeStatus(sCreate(0), adapter), {
    code: 'EMUT_EXPECTED_ADAPTER_METHOD'
  })
  await t.throwsAsync(() => writeStatus(sUpdate(0, 'UPDATE'), adapter), {
    code: 'EMUT_EXPECTED_ADAPTER_METHOD'
  })
  await t.throwsAsync(() => writeStatus(sDelete(0), adapter), {
    code: 'EMUT_EXPECTED_ADAPTER_METHOD'
  })
})

test('driver:sCreate', async t => {
  t.plan(3)

  const adapter = {
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

  const status = await writeStatus(sCreate(0), adapter, { hello: 'world' })

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

test('driver:sVoid', async t => {
  t.plan(2)

  const adapter = {
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

  const status = await writeStatus(sVoid(0), adapter, { hello: 'world' })

  t.deepEqual(status, await writeStatus(sVoid(0), {}))

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

test('driver:sUpdate', async t => {
  t.plan(4)

  const adapter = {
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

  const status = await writeStatus(sUpdate(0, 'UPDATE'), adapter, {
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

test('driver:sDelete', async t => {
  t.plan(3)

  const adapter = {
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

  const status = await writeStatus(sDelete(0), adapter, { hello: 'world' })

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

test('driver:sCreateUpdate', async t => {
  t.plan(3)

  const adapter = {
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

  const status = await writeStatus(sCreateUpdate(0, 'UPDATE'), adapter, {
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

test('driver:sCreateDelete', async t => {
  t.plan(1)

  const adapter = {
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

  const status = await writeStatus(sCreateDelete(0), adapter, {
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

test('driver:sUpdateDelete', async t => {
  t.plan(3)

  const adapter = {
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

  const status = await writeStatus(sUpdateDelete(0, 'UPDATE'), adapter, {
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

test('driver:sCreateUpdateDelete', async t => {
  t.plan(1)

  const adapter = {
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

  const status = await writeStatus(sCreateUpdateDelete(0, 'UPDATE'), adapter, {
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
