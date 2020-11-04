import test from 'ava'

import { existsData } from './reader'

test('reader:noExists', async t => {
  const driver = {}
  t.false(await existsData(driver, {}, {}))
})

test('reader:findExists', async t => {
  const driver = {
    async find(query) {
      if (query === true) {
        return { a: 'document' }
      } else {
        return null
      }
    }
  }
  t.false(await existsData(driver, false))
  t.true(await existsData(driver, true))
})

test('reader:yesExists', async t => {
  const driver = {
    async find() {
      t.fail()
    },
    async exists(query) {
      return query === 'Flying Spaghetti Monster'
    }
  }
  t.false(await existsData(driver, 'God'))
  t.true(await existsData(driver, 'Flying Spaghetti Monster'))
})
