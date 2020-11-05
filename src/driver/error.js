import Herry from 'herry'

export function DriverError(method, info) {
  throw new Herry(
    'EMUT_EXPECTED_DRIVER_METHOD',
    `Driver ".${method}" method is required for this operation`,
    info
  )
}
