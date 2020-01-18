import { Db, ObjectId } from 'mongodb'
import _ from 'lodash'

import { wrapCollection } from './mutent'

interface User {
  _id: ObjectId
  username: string
  password: string
  disabled?: false
}

function toUpperCase (user: User): User {
  return {
    ...user,
    username: user.username.toUpperCase()
  }
}

export default async function server (db: Db) {
  const wrapped = wrapCollection(db.collection<User>('users'))

  const createdUser = await wrapped
    // Define data
    .insertOne({
      _id: new ObjectId(),
      username: 'john_wick',
      password: 'be_kind_to_animals'
    })
    // Write
    .commit()
    // Execute
    .unwrap()

  const updatedUsers = await wrapped
    // All users with username starting with an 'a'
    .findMany({ username: /^a/i })
    // UpperCase the username
    .update(toUpperCase)
    // Set as disabled
    .update(_.set, 'disabled', true)
    // Write
    .commit()
    // Execute
    .unwrap()

  const allUsernames = await wrapped
    // All users
    .findMany({})
    // Get the username
    .update(_.get, 'username')
    // Execute (no writes)
    .unwrap()

  return {
    createdUser,
    updatedUsers,
    allUsernames
  }
}
