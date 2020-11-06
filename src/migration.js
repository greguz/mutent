import Herry from 'herry'

import { updateStatus } from './status'

function getLastVersion(strategies) {
  return Object.keys(strategies)
    .map(key => parseInt(key, 10))
    .filter(key => Number.isInteger(key) && key >= 0)
    .reduce((a, b) => (a > b ? a : b), 0)
}

export class Migration {
  constructor(strategies, versionKey = 'version') {
    this._lastVersion = getLastVersion(strategies)
    this._strategies = strategies
    this._versionKey = versionKey
  }

  getVersion(data) {
    return data[this._versionKey] || 0
  }

  async migrateStatus(status) {
    const vLast = this._lastVersion
    const vCurr = this.getVersion(status.target)
    if (vCurr >= vLast) {
      return status
    }

    let data = status.target
    for (let v = vCurr + 1; v <= vLast; v++) {
      const strategy = this._strategies[v]
      if (typeof strategy !== 'function') {
        throw new Herry('EMUT_MISSING_STRATEGY', 'Missing migration strategy', {
          version: v
        })
      }
      data = await strategy(data)
      if (this.getVersion(data) !== v) {
        throw new Herry('EMUT_EXPECTED_UPGRADE', 'Expected version upgrade', {
          version: v,
          data
        })
      }
    }

    return updateStatus(status, data)
  }
}
