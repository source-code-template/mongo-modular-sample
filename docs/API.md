# HTTP API Reference

This page describes only routes registered in `src/route.ts` and behavior visible in `src/user/controller.ts`. Exact request/response schemas for shared-library helpers are not included where the checked-in source does not define them.

## System endpoints

| Method | Path | Handler | Observed behavior |
|---|---|---|---|
| `GET` | `/health` | `ctx.health.check` | Runs the health controller configured with a `MongoChecker`. |
| `PATCH` | `/log` | `ctx.log.config` | Delegates logger configuration to `LogController`. |
| `PATCH` | `/middleware` | `ctx.middleware.config` | Delegates middleware configuration to `MiddlewareController`. |

The request logging middleware is registered before routes. Its context builder reads `X-Request-ID` and `X-Correlation-ID`. Its request/response hooks mask top-level `phone` and `email` properties; they do not encrypt the full payload.

## User endpoints

### Search users

`GET /users/search` and `POST /users/search`

- Controller: `UserController.search`.
- Reads a `UserFilter` through `fromRequest<UserFilter>(req, ["fields"])`.
- Calls `format(filter, ["dateOfBirth"])`.
- Passes `filter`, `limit`, `page`, and `fields` to `service.search(...)`.
- Returns HTTP 200 with the service result.
- Exceptions are delegated to `handleError`.

The exact filter parsing, pagination defaults, and result envelope are supplied by `express-web-kit` / `onecore` and are not defined in this repository's source. Do not invent them when documenting or changing the API.

### Load one user

`GET /users/:id`

- Reads `req.params.id`.
- Calls `service.load(id)`.
- Returns HTTP 200 when a user is present, otherwise HTTP 404.
- Serializes the returned value with `res.json(user)`.

### Create a user

`POST /users`

- Treats `req.body` as `User`.
- Selects validation resources with `getResource(req)`.
- Validates with `validate<User>(user, userModel, resource)`.
- On validation errors, returns `getStatusCode(errors)` and the errors array.
- Otherwise calls `service.create(user)`.
- Returns HTTP 201 when `isSuccessful(result)` is true; otherwise HTTP 409.
- Returns the result JSON and ends the response.

### Update a user

`PUT /users/:id`

- Treats `req.body` as `User` and overwrites `user.id` with the route parameter.
- Validates against the full `userModel`.
- On validation errors, returns `getStatusCode(errors)` and the errors array.
- Otherwise calls `service.update(user)`.
- Returns HTTP 200 when successful; otherwise HTTP 404.

### Patch a user

`PATCH /users/:id`

- Treats `req.body` as `User` and overwrites `user.id` with the route parameter.
- Calls `validate<User>(user, userModel, resource, false, true)`.
- On validation errors, returns `getStatusCode(errors)` and the errors array.
- Otherwise calls `service.patch(user)`.
- Returns HTTP 200 when successful; otherwise HTTP 404.

The meaning of the two boolean validation arguments is not defined locally; inspect `validation-core` before changing or documenting their detailed semantics.

### Delete a user

`DELETE /users/:id`

- Calls `service.delete(id)`.
- Returns HTTP 200 with the deleted count when count is greater than zero.
- Returns HTTP 410 with the count when no record was deleted.

## Current user model

The TypeScript interface and validation model are in `src/user/user.ts`.

| Property | TypeScript type | Validation metadata | Notes |
|---|---|---|---|
| `id` | `string` | key, length 40 | Identifier |
| `username` | `string` | required, length 255 | Resource key `username` |
| `email` | `string` optional | required, email format, length 120 | Interface/validation requiredness differs |
| `phone` | `string` optional | required, phone format, length 14 | Interface/validation requiredness differs |
| `dateOfBirth` | `Date` optional | datetime; mapped to `date_of_birth` | Formatted in search controller |

This is the model currently used by the user repository and controller. It does not represent every column in the supplied SQL `users` table; see `docs/DATABASE.md`.

## Response conventions

- The controller generally serializes service results directly; no shared `{ data, error }` envelope is defined in the source.
- Validation errors are returned as an array.
- Service exceptions are delegated to `handleError` from `express-web-kit`.
- The controller's HTTP status mapping is explicit in its methods and should be preserved unless the API contract changes intentionally.

## Not implemented in the supplied source

No routes are registered for company ratings/comments/reactions, user follows, skills/interests, categories/content, jobs, saved jobs, articles, saved articles, or article ratings/comments/reactions. Those entities appear in the supplied PostgreSQL design only.
