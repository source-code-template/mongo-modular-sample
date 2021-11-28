import { HealthController, LogController, resources } from 'express-ext';
import { JSONLogger, LogConfig, map } from 'logger-core';
import { Db } from 'mongodb';
import { buildQuery, MongoChecker, SearchBuilder as MongoSearchBuilder } from 'mongodb-extension';
import { createValidator } from 'xvalidators';
import { MongoUserService, User, UserController, UserFilter, userModel } from './user';

resources.createValidator = createValidator;

export interface Config {
  log: LogConfig;
}
export interface ApplicationContext {
  health: HealthController;
  log: LogController;
  user: UserController;
}
export function createContext(db: Db, conf: Config): ApplicationContext {
  const logger = new JSONLogger(conf.log.level, conf.log.map);
  const log = new LogController(logger, map);

  const mongoChecker = new MongoChecker(db);
  const health = new HealthController([mongoChecker]);

  const userSearchBuilder = new MongoSearchBuilder<User, UserFilter>(db, 'users', buildQuery, userModel.attributes);
  const userService = new MongoUserService(userSearchBuilder.search, db);
  const user = new UserController(logger.error, userService);

  return { health, log, user };
}
