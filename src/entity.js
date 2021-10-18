export class Entity {
  static create (data) {
    return new Entity(data)
  }

  static read (data) {
    return Entity.create(data).commit()
  }

  get shouldCreate () {
    return this.source === null && this.created && !this.deleted
  }

  get shouldUpdate () {
    return this.source !== null && this.updated && !this.deleted
  }

  get shouldDelete () {
    return this.source !== null && this.deleted
  }

  get shouldCommit () {
    return this.shouldCreate || this.shouldUpdate || this.shouldDelete
  }

  constructor (data) {
    if (data === null || data === undefined) {
      throw new TypeError('Cannot accept a nullish value to create an entity')
    }

    this.source = null
    this.target = data

    this.created = true
    this.updated = false
    this.deleted = false

    this.meta = {}
  }

  commit () {
    this.source = this.deleted ? null : this.target
    this.created = false
    this.updated = false
    this.deleted = false
    return this
  }

  delete () {
    this.deleted = true
    return this
  }

  set (data) {
    this.target = data
    return this
  }

  update (data) {
    if (data === null || data === undefined) {
      throw new TypeError('Cannot accept a nullish value to update an entity')
    }
    if (this.target !== data) {
      this.target = data
      this.updated = true
    }
    return this
  }

  valueOf () {
    return this.target
  }
}
