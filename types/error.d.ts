export declare class MutentError extends Error {
  /**
   * @constructor
   * @param code Error identifier. All CAPS words and underscores.
   * @param message Human readable message.
   * @param info Detailed info object.
   */
  constructor(code: string, message: string, info?: any)
  /**
   * Custom JSON serialization function.
   */
  toJSON(): { error: string; message: string; info: any }
}
