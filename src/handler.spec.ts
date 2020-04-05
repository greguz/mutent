import test from 'ava'

import { Driver, createHandler } from './handler'
import { Status, commitStatus, createStatus, deleteStatus, updateStatus } from './status'

interface Item {
  id: number
  value?: any
}

function sCreate (id: number): Status<Item> {
  return createStatus({ id })
}

function sVoid (id: number) {
  return commitStatus(sCreate(id))
}

function sUpdate (id: number, value: any): Status<Item> {
  return updateStatus(sVoid(id), { id, value })
}

function sDelete (id: number): Status<Item> {
  return deleteStatus(sVoid(id))
}

function sCreateDelete (id: number): Status<Item> {
  return deleteStatus(sCreate(id))
}

function sUpdateDelete (id: number, value: any): Status<Item> {
  return deleteStatus(sUpdate(id, value))
}

function run (
  driver: Driver<Item, any> | undefined,
  status: Status<Item>,
  options?: any
) {
  return createHandler(driver)(status, options)
}

test('sCreate', async t => {
  t.plan(4)

  const driver: Driver<Item> = {
    async create (target, options) {
      t.deepEqual(target, {
        id: 0
      })
      t.deepEqual(options, {
        hello: 'world'
      })
      return target
    },
    async update (source, target, options) {
      t.fail()
    },
    async delete (source, options) {
      t.fail()
    }
  }

  const status = await run(driver, sCreate(0), { hello: 'world' })

  t.deepEqual(status, await run(undefined, sCreate(0)))

  t.deepEqual(status, {
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

test('sVoid', async t => {
  t.plan(2)

  const driver: Driver<Item> = {
    async create (target, options) {
      t.fail()
    },
    async update (source, target, options) {
      t.fail()
    },
    async delete (source, options) {
      t.fail()
    }
  }

  const status = await run(driver, sVoid(0), { hello: 'world' })

  t.deepEqual(status, await run(undefined, sVoid(0)))

  t.deepEqual(status, {
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
  t.plan(5)

  const driver: Driver<Item> = {
    async create (target, options) {
      t.fail()
    },
    async update (source, target, options) {
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
      return target
    },
    async delete (source, options) {
      t.fail()
    }
  }

  const status = await run(driver, sUpdate(0, 'UPDATE'), { hello: 'world' })

  t.deepEqual(status, await run(undefined, sUpdate(0, 'UPDATE')))

  t.deepEqual(status, {
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

test('sDelete', async t => {
  t.plan(4)

  const driver: Driver<Item> = {
    async create (target, options) {
      t.fail()
    },
    async update (source, target, options) {
      t.fail()
    },
    async delete (source, options) {
      t.deepEqual(source, {
        id: 0
      })
      t.deepEqual(options, {
        hello: 'world'
      })
      return source
    }
  }

  const status = await run(driver, sDelete(0), { hello: 'world' })

  t.deepEqual(status, await run(undefined, sDelete(0)))

  t.deepEqual(status, {
    updated: false,
    deleted: false,
    source: null,
    target: {
      id: 0
    }
  })
})

test('sCreateDelete', async t => {
  t.plan(6)

  const driver: Driver<Item> = {
    async create (target, options) {
      t.deepEqual(target, {
        id: 0
      })
      t.deepEqual(options, {
        hello: 'world'
      })
    },
    async update (source, target, options) {
      t.fail()
    },
    async delete (source, options) {
      t.deepEqual(source, {
        id: 0
      })
      t.deepEqual(options, {
        hello: 'world'
      })
      return source
    }
  }

  const status = await run(driver, sCreateDelete(0), { hello: 'world' })

  t.deepEqual(status, await run(undefined, sCreateDelete(0)))

  t.deepEqual(status, {
    updated: false,
    deleted: false,
    source: null,
    target: {
      id: 0
    }
  })
})

test('sUpdateDelete', async t => {
  t.plan(7)

  const driver: Driver<Item> = {
    async create (target, options) {
      t.fail()
    },
    async update (source, target, options) {
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
      return target
    },
    async delete (source, options) {
      t.deepEqual(source, {
        id: 0,
        value: 'UPDATE'
      })
      t.deepEqual(options, {
        hello: 'world'
      })
      return source
    }
  }

  const status = await run(driver, sUpdateDelete(0, 'UPDATE'), { hello: 'world' })

  t.deepEqual(status, await run(undefined, sUpdateDelete(0, 'UPDATE')))

  t.deepEqual(status, {
    updated: false,
    deleted: false,
    source: null,
    target: {
      id: 0,
      value: 'UPDATE'
    }
  })
})
