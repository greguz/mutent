import Herry from 'herry'

export const MutentError = Herry

export const UndefinedEntityError = Herry.define(
  'EMUT_NODEF',
  'Undefined entity'
)

export class UnknownEntityError extends MutentError {
  public query: any
  public options: any
  constructor (query: any, options: any) {
    super('EMUT_NOENT', 'Unknown entity', {
      query,
      options
    })
    this.query = query
    this.options = options
  }
}

export class ExpectedCommitError extends MutentError {
  public source: any
  public target: any
  public options: any
  constructor (source: any, target: any, options: any) {
    super('EMUT_NOCOM', 'Expected commit', {
      source,
      target,
      options
    })
    this.source = source
    this.target = target
    this.options = options
  }
}

export const UnknownRoutineError = Herry.define(
  'EMUT_NORTN',
  'Unknown routine'
)
