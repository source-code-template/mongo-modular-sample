import { Db } from "mongodb"
import { Repository } from "mongodb-kit"
import { User, UserFilter, userModel, UserRepository } from "./user"

export class MongoUserRepository extends Repository<User, string, UserFilter> implements UserRepository {
  constructor(db: Db) {
    super(db, "users", userModel)
  }
}
