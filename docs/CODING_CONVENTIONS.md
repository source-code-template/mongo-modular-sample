# Coding Conventions and Feature Template

This guide records conventions observed in the supplied TypeScript source. When adding code, match these patterns unless a requirement explicitly changes them.

## 1. Formatting

`.prettierrc.json` specifies:

- `printWidth`: 260
- `tabWidth`: 2
- `trailingComma`: `all`
- `semi`: `false`
- `singleQuote`: `false`

Use double quotes, no semicolons, two spaces, and trailing commas in multiline literals/calls. Keep imports at the top of each file.

## 2. Naming

| Kind | Convention | Existing example |
|---|---|---|
| Feature directory | lower-case singular | `src/user/` |
| Source file | lower-case | `controller.ts`, `repository.ts` |
| Interface / class | PascalCase | `UserFilter`, `UserController` |
| Function / variable | camelCase | `useUserController`, `userModel` |
| Validation metadata | lower-camel `<feature>Model` | `userModel` |
| Route path | plural resource | `/users/:id` |
| Mongo repository | `Mongo<Feature>Repository` | `MongoUserRepository` |
| Use-case class | `<Feature>UseCase` | `UserUseCase` |

## 3. Module file responsibilities

Use this layout for another feature when it fits:

```text
src/<feature>/
├── <feature>.ts
├── repository.ts
├── service.ts
├── controller.ts
└── index.ts
```

### `<feature>.ts`

Keep the feature's domain-facing contracts together:

- Entity interface, e.g. `User`.
- Search/filter interface extending `Filter`, e.g. `UserFilter`.
- Repository interface describing persistence operations.
- Service interface describing use-case operations and their result types.
- `Attributes` metadata used by `validation-core` and the Mongo repository.

The existing contracts distinguish repository create/update methods returning `Promise<number>` from service create/update methods returning `Promise<Result<User>>`.

### `repository.ts`

For a MongoDB-backed feature, extend the shared `Repository` and pass the database, collection name, and model metadata to `super`:

```ts
export class MongoFeatureRepository extends Repository<Feature, string, FeatureFilter> implements FeatureRepository {
  constructor(db: Db) {
    super(db, "features", featureModel)
  }
}
```

This is a shape example, not a guarantee that every collection should be named by pluralizing the feature. Use the actual collection convention required by the feature.

### `service.ts`

The existing service extends `UseCase` and implements the feature service interface:

```ts
export class FeatureUseCase extends UseCase<Feature, string, FeatureFilter> implements FeatureService {
  constructor(repository: FeatureRepository) {
    super(repository)
  }
}
```

Add custom methods only when the feature requires behavior beyond the generic use case. Keep domain decisions out of the Express controller.

### `controller.ts`

- Import `Request` and `Response` from `express`.
- Use async methods for handlers.
- Bind each handler in the constructor when passing it directly to Express (`this.method = this.method.bind(this)`).
- Read request query/path/body data in the controller.
- Validate write payloads with the feature's model metadata and `getResource(req)`.
- Use `getStatusCode(errors)` for validation failures.
- Use `handleError(err, res)` for caught service errors.
- Return the service result directly with `res.status(...).json(...)`, matching the existing API style.

The existing controller does not declare explicit return types for its async handlers. Match this unless adding explicit types is part of a broader consistency change.

### `index.ts`

Create the dependency chain in one factory and export the public feature types/classes:

```ts
export function useFeatureController(db: Db): FeatureController {
  const repository = new MongoFeatureRepository(db)
  const service = new FeatureUseCase(repository)
  return new FeatureController(service)
}
```

The current `user/index.ts` also re-exports the controller and model types.

## 4. Validation metadata

The current `userModel` uses `Attributes` from `onecore`. It demonstrates these metadata properties:

- `key: true` for the identifier.
- `length` for maximum field length.
- `required: true` for required fields.
- `format` for format checks such as `email` and `phone`.
- `type: "datetime"` for date/time values.
- `column` to map a camelCase property to a snake_case column/field name.
- `resource` to choose the localized field label.

Example from the existing model, shortened to the conventions in use:

```ts
export const featureModel: Attributes = {
  id: {
    key: true,
    length: 40,
  },
  name: {
    required: true,
    length: 255,
    resource: "name",
  },
}
```

Do not assume undocumented metadata options. Inspect the installed `onecore` / `validation-core` type declarations if a new option is needed.

**Important existing mismatch:** `User.email` and `User.phone` are optional in the TypeScript interface but required in `userModel`. A new feature should keep its TypeScript optionality and validation rules consistent unless the API contract intentionally distinguishes them.

## 5. Controller behavior conventions

Observed examples:

- Search: `fromRequest<FeatureFilter>(req, ["fields"])`, `format(...)`, then `service.search(filter, limit, page, fields)`.
- Load: read `req.params.id`, call `service.load(id)`, return 200 or 404.
- Create: validate, call service, return 201 on `isSuccessful(result)` or 409 otherwise.
- Update: assign the route ID to the body, validate the complete model, return 200 or 404 based on success.
- Patch: assign the route ID, call `validate(..., false, true)`, then service patch; the exact meaning of those validation flags belongs to `validation-core` and should not be reinterpreted without checking that package.
- Delete: return 200 with the deleted count when count is positive; otherwise the existing code returns 410.

These are conventions currently in `UserController`, not universal REST rules. Do not silently change their status-code mapping in another feature without a requirement.

## 6. Imports and dependency boundaries

- Use Express types in controllers and route wiring.
- Use MongoDB `Db` in feature factories/repositories.
- Keep shared package abstractions behind the layer that uses them: `mongodb-kit` in repositories, `onecore` in contracts/services, `validation-core` in controller validation and context setup.
- Use relative imports for local modules (`../resources`, `./user`).
- Avoid circular dependencies. The current feature `index.ts` imports its implementation files and re-exports the public feature types.

## 7. Localization

When adding validation message keys:

1. Add the key/value to `src/resources/en.ts`.
2. Add the equivalent key/value to `src/resources/vi.ts`.
3. Add a suitable `resource` key to the field metadata where applicable.
4. Keep the placeholder format expected by the existing messages (`{0}`, `{1}`, etc.).

`getResource` falls back to English for missing/unknown language values.

## 8. API route wiring

Add explicit route mappings in `src/route.ts`. Routes refer to controller methods already exposed on `ApplicationContext`; do not instantiate a controller in the route module.

If a new feature is added, update its `ApplicationContext` property and construct it in `useContext` in `src/context.ts`.

## 9. Avoid these deviations

Unless a requirement justifies them, do not:

- Replace the current modular structure with a different framework or architecture.
- Put database queries directly in controllers.
- Put Express request/response objects in repositories or services.
- Hard-code translated labels in controller logic.
- Add a response envelope when existing endpoints return raw results.
- Treat `encryptRequest` / `encryptResponse` as real encryption; they currently mask selected fields.
- Assume PostgreSQL is configured because the supplied SQL schema exists.
- Add credentials to code, examples, fixtures, or logs.
