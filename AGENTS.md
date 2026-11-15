# Instructions for AI Coding Agents

You are working in a small TypeScript + Express modular API. Follow the existing source patterns, keep changes focused, and distinguish observed implementation from the separately supplied PostgreSQL schema.

## Read these documents first

1. `README.md` — project purpose, setup, and implemented scope.
2. `docs/ARCHITECTURE.md` — startup, feature composition, and dependency flow.
3. `docs/CODING_CONVENTIONS.md` — required style and code patterns.
4. `docs/API.md` — existing routes and controller behavior.
5. `docs/DATABASE.md` — persistence reality and supplied SQL schema.
6. `docs/DEVELOPMENT.md` — configuration, scripts, and known caveats.

## Non-negotiable project facts

- The checked-in application uses **MongoDB**, not PostgreSQL.
- MongoDB is connected in `src/app.ts` through `connectToDb` from `mongodb-kit`.
- The current implemented collection repository is `MongoUserRepository`, which targets the `users` collection.
- The supplied PostgreSQL DDL is reference material only. It is not wired to a PostgreSQL driver, pool, query builder, migration runner, or repository in this codebase.
- Only the `user` feature has source files. Do not describe company reviews, jobs, articles, follows, etc. as implemented.
- The source `User` interface contains only `id`, `username`, `email`, `phone`, and `dateOfBirth`; the supplied SQL `users` table has many more columns.
- `userModel` marks `username`, `email`, and `phone` as required even though `email` and `phone` are optional in the TypeScript interface. Preserve or intentionally resolve this mismatch; do not overlook it.
- The npm `test` script is a placeholder. No test files or test framework were included in the supplied archive.

## Required database decision before persistence work

When a task refers to one of the supplied SQL tables, first establish the intended persistence target from the task context:

- If MongoDB remains the target, implement using the repository's existing MongoDB pattern and explicitly map the required domain fields/documents. Do not write PostgreSQL SQL and assume it will run.
- If PostgreSQL is the target, treat that as an architectural change. Do not pretend `mongodb-kit` can access the SQL schema. Identify the PostgreSQL driver/repository strategy, configuration, lifecycle, migrations, and transaction needs as part of the change.
- If the target is unclear and the choice changes the implementation materially, surface the conflict rather than silently selecting a database.

Use `docs/DATABASE.md` as a schema reference, not proof that a table exists at runtime. The supplied DDL does not declare foreign-key constraints for the apparent relationships. Do not invent FK enforcement or unspecified JSON shapes.

## Existing feature pattern

For a new feature, follow the `user` module unless the task explicitly calls for a different architecture:

```text
src/<feature>/
├── <feature>.ts       # Interfaces, filter, contracts, validation model
├── repository.ts      # Database adapter
├── service.ts         # Use-case layer
├── controller.ts      # Express request handlers
└── index.ts           # Feature factory and exports
```

Then wire the feature in both places:

1. Add its controller type/property and factory construction in `src/context.ts` / `ApplicationContext`.
2. Register its endpoints in `src/route.ts`.

Do not add a route that is not wired to the context, or a context controller that is not constructed.

## Implementation rules

- Keep HTTP concerns in controllers, business/use-case orchestration in services, and persistence operations in repositories.
- Keep TypeScript contracts and `Attributes` validation metadata together in the feature's `<feature>.ts`, matching `src/user/user.ts`.
- Prefer the existing generic `UseCase` and `Repository` abstractions when they fit. Do not bypass them without a concrete reason.
- Keep the feature factory in `index.ts`; follow the `useUserController(db)` naming shape when appropriate.
- Bind controller instance methods in the constructor when they are passed directly to Express routes, as `UserController` does.
- Use `getResource(req)` and `validate(...)` for request-body validation in the same pattern as the user controller, unless the task establishes a different validation contract.
- Use `handleError(err, res)` in controller catch blocks.
- Preserve observed response conventions unless a requirement explicitly changes them. The project returns service results directly; there is no common response envelope in the checked-in code.
- Do not invent behavior for imported packages. Inspect their installed declarations/documentation if available before depending on undocumented semantics.
- Avoid unrelated refactors and avoid adding dependencies unless required.
- Do not add secrets or copy credentials from `.env` or `src/config.ts` into source, documentation, test fixtures, or logs.

## Style rules

- Follow `.prettierrc.json`: double quotes, no semicolons, two-space indentation, trailing commas, and print width 260.
- Use the existing file names and naming conventions: lower-case file names, PascalCase types/classes, camelCase functions/variables, and lower-camel validation-model constants (for example, `userModel`).
- Keep imports at the top of each file and use double-quoted module paths.
- Match existing async/await and Express controller style.
- Keep API routes explicit in `src/route.ts`.
- Do not introduce a new framework, decorator-based pattern, DI container, or folder hierarchy without a task requirement.

## Validation and delivery checklist

Before finishing a code change:

1. Confirm the change is consistent with the actual database adapter and the target database decision.
2. Update `ApplicationContext`, feature factory wiring, and `src/route.ts` when adding a feature.
3. Check field names against the actual model and database representation. In particular, SQL uses `date_of_birth` while the TypeScript property is `dateOfBirth`.
4. Preserve validation behavior and status-code conventions, or document deliberate changes.
5. Run the available build/test commands when dependencies are installed. Do not claim tests passed if they were not run.
6. Update the relevant `docs/` page and `README.md` if the architecture, API, persistence, or setup changes.
7. Report what was changed, what was verified, and any remaining database/schema ambiguity.
