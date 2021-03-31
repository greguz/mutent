/**
 * Presents the entity status during the mutation.
 */
export interface Status<T> {
  /**
   * When true, target property contains a new entity to create inside the database.
   */
  created: boolean
  /**
   * Whe true, indicates that source and target are different (an update was performed).
   */
  updated: boolean
  /**
   * When true, a deletion is required against the database.
   */
  deleted: boolean
  /**
   * Contains the origianl entity data fetched from the database, or null when the entity is new (created).
   */
  source: T | null
  /**
   * Container the last version of the entity after all configured mutations.
   */
  target: T
}
