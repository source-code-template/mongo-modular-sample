import { Attributes, DateRange, Filter, Result, SearchResult } from "onecore"

export interface User {
  id: string
  username: string
  email?: string
  phone?: string
  dateOfBirth?: Date
}
export interface UserFilter extends Filter {
  id: string
  username: string
  email?: string
  phone?: string
  dateOfBirth?: Date | DateRange
}

export interface UserRepository {
  search(filter: UserFilter, limit: number, page?: number | string, fields?: string[]): Promise<SearchResult<User>>
  load(id: string): Promise<User | null>
  create(user: User): Promise<number>
  update(user: User): Promise<number>
  patch(user: Partial<User>): Promise<number>
  delete(id: string): Promise<number>
}
export interface UserService {
  search(filter: UserFilter, limit: number, page?: number | string, fields?: string[]): Promise<SearchResult<User>>
  load(id: string): Promise<User | null>
  create(user: User): Promise<Result<User>>
  update(user: User): Promise<Result<User>>
  patch(user: Partial<User>): Promise<Result<User>>
  delete(id: string): Promise<number>
}

export const userModel: Attributes = {
  id: {
    key: true,
    length: 40,
  },
  username: {
    required: true,
    length: 255,
    resource: "username",
  },
  email: {
    format: "email",
    required: true,
    length: 120,
    resource: "email",
  },
  phone: {
    format: "phone",
    required: true,
    length: 14,
    resource: "phone",
  },
  dateOfBirth: {
    column: "date_of_birth",
    type: "datetime",
    resource: "date_of_birth",
  },
}
