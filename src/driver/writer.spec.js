import test from 'ava'

import { writeStatus } from './writer'
import {
  commitStatus,
  createStatus,
  deleteStatus,
  updateStatus
} from '../status'

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

  const status = await writeStatus(sCreate(0), writer, { hello: 'world' })

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

  const status = await writeStatus(sVoid(0), writer, { hello: 'world' })

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

  const status = await writeStatus(sUpdate(0, 'UPDATE'), writer, {
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

  const status = await writeStatus(sDelete(0), writer, { hello: 'world' })

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
  t.plan(4)

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

  const status = await writeStatus(sCreateUpdate(0, 'UPDATE'), writer, {
    hello: 'world'
  })

  t.deepEqual(status, await writeStatus(sCreateUpdate(0, 'UPDATE'), {}))

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

  const status = await writeStatus(sCreateDelete(0), writer, { hello: 'world' })

  t.deepEqual(status, await writeStatus(sCreateDelete(0), {}))

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
  t.plan(4)

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

  const status = await writeStatus(sUpdateDelete(0, 'UPDATE'), writer, {
    hello: 'world'
  })

  t.deepEqual(status, await writeStatus(sUpdateDelete(0, 'UPDATE'), {}))

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

  const status = await writeStatus(sCreateUpdateDelete(0, 'UPDATE'), writer, {
    hello: 'world'
  })

  t.deepEqual(status, await writeStatus(sCreateUpdateDelete(0, 'UPDATE'), {}))

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
  const writer = {}

  const a = await writeStatus(sCreate(0), writer)
  t.deepEqual(a.target, { id: 0 })

  const b = await writeStatus(sUpdate(0, 'UPDATE'), writer)
  t.deepEqual(b.target, { id: 0, value: 'UPDATE' })

  const c = await writeStatus(sDelete(0), writer)
  t.deepEqual(c.target, { id: 0 })
})
