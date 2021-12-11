import { HealthController, LogController, resources } from 'express-ext';
import { JSONLogger, LogConfig, map } from 'logger-core';
import { Db } from 'mongodb';
import { MongoChecker } from 'mongodb-extension';
import { createValidator } from 'xvalidators';
import { UserController, useUserController } from './user';

resources.createValidator = createValidator;

export interface Config {
  log: LogConfig;
}
export interface ApplicationContext {
  health: HealthController;
  log: LogController;
  user: UserController;
}
export function useContext(db: Db, conf: Config): ApplicationContext {
  const logger = new JSONLogger(conf.log.level, conf.log.map);
  const log = new LogController(logger, map);

  const mongoChecker = new MongoChecker(db);
  const health = new HealthController([mongoChecker]);

  const user = useUserController(logger.error, db);

  return { health, log, user };
}
