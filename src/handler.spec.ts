import test from 'ava'

import { Driver, handleDriver } from './handler'
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

test('sCreate', async t => {
  t.plan(3)

  const driver: Driver<Item> = {
    async create (target, options) {
      t.deepEqual(target, {
        id: 0
      })
      t.deepEqual(options, {
        hello: 'world'
      })
      return {
        ...target,
        id: target.id + 1
      }
    },
    async update () {
      t.fail()
    },
    async delete () {
      t.fail()
    }
  }

  const status = await handleDriver(driver, sCreate(0), { hello: 'world' })

  t.deepEqual(status, {
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

  const driver: Driver<Item> = {
    async create () {
      t.fail()
    },
    async update () {
      t.fail()
    },
    async delete () {
      t.fail()
    }
  }

  const status = await handleDriver(driver, sVoid(0), { hello: 'world' })

  t.deepEqual(status, await handleDriver({}, sVoid(0)))

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
  t.plan(4)

  const driver: Driver<Item> = {
    async create () {
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
      return {
        ...target,
        id: target.id + 1
      }
    },
    async delete () {
      t.fail()
    }
  }

  const status = await handleDriver(driver, sUpdate(0, 'UPDATE'), { hello: 'world' })

  t.deepEqual(status, {
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

  const driver: Driver<Item> = {
    async create () {
      t.fail()
    },
    async update () {
      t.fail()
    },
    async delete (source, options) {
      t.deepEqual(source, {
        id: 0
      })
      t.deepEqual(options, {
        hello: 'world'
      })
      return {
        ...source,
        id: source.id + 1
      }
    }
  }

  const status = await handleDriver(driver, sDelete(0), { hello: 'world' })

  t.deepEqual(status, {
    updated: false,
    deleted: false,
    source: null,
    target: {
      id: 1
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
    async update () {
      t.fail()
    },
    async delete (source, options) {
      t.deepEqual(source, {
        id: 0
      })
      t.deepEqual(options, {
        hello: 'world'
      })
    }
  }

  const status = await handleDriver(driver, sCreateDelete(0), { hello: 'world' })

  t.deepEqual(status, await handleDriver({}, sCreateDelete(0)))

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
    async create () {
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
    },
    async delete (source, options) {
      t.deepEqual(source, {
        id: 0,
        value: 'UPDATE'
      })
      t.deepEqual(options, {
        hello: 'world'
      })
    }
  }

  const status = await handleDriver(driver, sUpdateDelete(0, 'UPDATE'), { hello: 'world' })

  t.deepEqual(status, await handleDriver({}, sUpdateDelete(0, 'UPDATE')))

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
