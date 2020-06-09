import test from 'ava'

import { Writer, handleWriter } from './writer'
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

function sCreateUpdate (id: number, value: any): Status<Item> {
  return updateStatus(sCreate(id), { id, value })
}

function sCreateDelete (id: number): Status<Item> {
  return deleteStatus(sCreate(id))
}

function sUpdateDelete (id: number, value: any): Status<Item> {
  return deleteStatus(sUpdate(id, value))
}

function sCreateUpdateDelete (id: number, value: any): Status<Item> {
  return deleteStatus(sCreateUpdate(id, value))
}

test('sCreate', async t => {
  t.plan(3)

  const driver: Writer<Item> = {
    create (data, options) {
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
    update () {
      t.fail()
    },
    delete () {
      t.fail()
    }
  }

  const status = await handleWriter(driver, sCreate(0), { hello: 'world' })

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

  const driver: Writer<Item> = {
    create () {
      t.fail()
    },
    update () {
      t.fail()
    },
    delete () {
      t.fail()
    }
  }

  const status = await handleWriter(driver, sVoid(0), { hello: 'world' })

  t.deepEqual(status, await handleWriter({}, sVoid(0)))

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

  const driver: Writer<Item> = {
    create () {
      t.fail()
    },
    update (target, options, source) {
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
    delete () {
      t.fail()
    }
  }

  const status = await handleWriter(driver, sUpdate(0, 'UPDATE'), { hello: 'world' })

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

  const driver: Writer<Item> = {
    create () {
      t.fail()
    },
    update () {
      t.fail()
    },
    delete (data, options) {
      t.deepEqual(data, {
        id: 0
      })
      t.deepEqual(options, {
        hello: 'world'
      })
    }
  }

  const status = await handleWriter(driver, sDelete(0), { hello: 'world' })

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

  const driver: Writer<Item> = {
    create (data, options) {
      t.deepEqual(data, {
        id: 0,
        value: 'UPDATE'
      })
      t.deepEqual(options, {
        hello: 'world'
      })
    },
    update () {
      t.fail()
    },
    delete () {
      t.fail()
    }
  }

  const status = await handleWriter(driver, sCreateUpdate(0, 'UPDATE'), { hello: 'world' })

  t.deepEqual(status, await handleWriter({}, sCreateUpdate(0, 'UPDATE')))

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

  const driver: Writer<Item> = {
    create () {
      t.fail()
    },
    update () {
      t.fail()
    },
    delete () {
      t.fail()
    }
  }

  const status = await handleWriter(driver, sCreateDelete(0), { hello: 'world' })

  t.deepEqual(status, await handleWriter({}, sCreateDelete(0)))

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

  const driver: Writer<Item> = {
    create () {
      t.fail()
    },
    update () {
      t.fail()
    },
    delete (source, options) {
      t.deepEqual(source, {
        id: 0,
        value: 'UPDATE'
      })
      t.deepEqual(options, {
        hello: 'world'
      })
    }
  }

  const status = await handleWriter(driver, sUpdateDelete(0, 'UPDATE'), { hello: 'world' })

  t.deepEqual(status, await handleWriter({}, sUpdateDelete(0, 'UPDATE')))

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

  const driver: Writer<Item> = {
    create () {
      t.fail()
    },
    update () {
      t.fail()
    },
    delete () {
      t.fail()
    }
  }

  const status = await handleWriter(driver, sCreateUpdateDelete(0, 'UPDATE'), { hello: 'world' })

  t.deepEqual(status, await handleWriter({}, sCreateUpdateDelete(0, 'UPDATE')))

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
