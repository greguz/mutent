function isObjectLike (value: any): value is object {
  return typeof value === 'object' && value !== null
}

export function assignOptions (
  defaultOptions: any = {},
  currentOptions: any = {}
): any {
  if (isObjectLike(defaultOptions) && isObjectLike(currentOptions)) {
    return { ...defaultOptions, ...currentOptions }
  } else {
    return currentOptions
  }
}
