import { Db } from "mongodb"
import { UserController } from "./controller"
import { MongoUserRepository } from "./repository"
import { UserUseCase } from "./service"
export * from "./controller"
export * from "./user"

export function useUserController(db: Db): UserController {
  const repository = new MongoUserRepository(db)
  const service = new UserUseCase(repository)
  return new UserController(service)
}
