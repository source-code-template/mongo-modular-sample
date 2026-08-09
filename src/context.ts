import { HealthController, LogController, resources } from "express-web-kit"
import { Logger, updateLogger } from "logger-core"
import { Middleware, MiddlewareController } from "middleware-logging"
import { Db } from "mongodb"
import { MongoChecker } from "mongodb-kit"
import { createValidator } from "validation-core"
import { UserController, useUserController } from "./user"

resources.createValidator = createValidator

export interface ApplicationContext {
  health: HealthController
  log: LogController
  middleware: MiddlewareController
  user: UserController
}

export function useContext(db: Db, logger: Logger, midLogger: Middleware): ApplicationContext {
  const log = new LogController(logger, updateLogger)
  const middleware = new MiddlewareController(midLogger)
  const mongoChecker = new MongoChecker(db)
  const health = new HealthController([mongoChecker])

  const user = useUserController(db)

  return { health, log, middleware, user }
}
