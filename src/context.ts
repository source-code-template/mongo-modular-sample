import { HealthController, LogController, Logger, Middleware, MiddlewareController, resources } from 'express-ext';
import { Db } from 'mongodb';
import { MongoChecker } from 'mongodb-extension';
import { createValidator } from 'xvalidators';
import { UserController, useUserController } from './user';

resources.createValidator = createValidator;

export interface ApplicationContext {
  health: HealthController;
  log: LogController;
  middleware: MiddlewareController;
  user: UserController;
}
export function useContext(db: Db, logger: Logger, midLogger: Middleware): ApplicationContext {
  const log = new LogController(logger);
  const middleware = new MiddlewareController(midLogger);
  const mongoChecker = new MongoChecker(db);
  const health = new HealthController([mongoChecker]);

  const user = useUserController(logger.error, db);

  return { health, log, middleware, user };
}
