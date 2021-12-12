import { Db } from 'mongodb';
import { Repository } from 'mongodb-extension';
import { User, userModel } from './user';

export class MongoUserRepository extends Repository<User, string> {
  constructor(db: Db) {
    super(db, 'users', userModel.attributes);
  }
}
