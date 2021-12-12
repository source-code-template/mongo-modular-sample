import { Db } from 'mongodb';
import { buildQuery, SearchBuilder } from 'mongodb-extension';
import { User, UserFilter, userModel, UserService } from './user';
import { UserController } from './user-controller';
export * from './user';
export { UserController };

import { MongoUserService } from './mongo-user-service';

export function useUser(db: Db): UserService {
  const builder = new SearchBuilder<User, UserFilter>(db, 'users', buildQuery, userModel.attributes);
  return new MongoUserService(builder.search, db);
}
export function useUserController(log: (msg: string) => void, db: Db): UserController {
  return new UserController(log, useUser(db));
}
