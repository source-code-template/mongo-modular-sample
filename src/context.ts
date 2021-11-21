import { HealthController, resources } from 'express-ext';
import { Db } from 'mongodb';
import { buildQuery, MongoChecker, SearchBuilder as MongoSearchBuilder } from 'mongodb-extension';
import { createValidator } from 'xvalidators';
import { MongoUserService, User, UserController, UserFilter, userModel } from './user';

resources.createValidator = createValidator;

export interface ApplicationContext {
  health: HealthController;
  user: UserController;
}
export function createContext(db: Db): ApplicationContext {
  const mongoDb: Db = db as Db;
  const mongoChecker = new MongoChecker(mongoDb);
  const health = new HealthController([mongoChecker]);

  const userSearchBuilder = new MongoSearchBuilder<User, UserFilter>(mongoDb, 'users', buildQuery, userModel.attributes);
  const userService = new MongoUserService(userSearchBuilder.search, mongoDb);
  const user = new UserController(log, userService);

  return { health, user };
}
export function log(msg: string, ctx?: any): void {
  console.log(msg);
}
