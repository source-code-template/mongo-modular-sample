import { Db } from 'mongodb';
import { buildQuery, SearchBuilder } from 'mongodb-extension';
import { Manager, SearchResult } from 'onecore';
import { User, UserFilter, userModel, UserRepository, UserService } from './user';
import { UserController } from './user-controller';
export * from './user';
export { UserController };

import { MongoUserRepository } from './mongo-user-repository';

export class UserManager extends Manager<User, string, UserFilter> implements UserService {
  constructor(find: (s: UserFilter, limit?: number, offset?: number | string, fields?: string[]) => Promise<SearchResult<User>>, repository: UserRepository) {
    super(find, repository);
  }
}
export function useUser(db: Db): UserService {
  const builder = new SearchBuilder<User, UserFilter>(db, 'users', buildQuery, userModel.attributes);
  const repository = new MongoUserRepository(db);
  return new UserManager(builder.search, repository);
}
export function useUserController(log: (msg: string) => void, db: Db): UserController {
  return new UserController(log, useUser(db));
}
