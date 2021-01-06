export interface Status<T> {
  created: boolean
  updated: boolean
  deleted: boolean
  source: T | null
  target: T
}
