# Development, Configuration, and Operational Notes

## 1. Package scripts

The supplied `package.json` defines:

| Script | Behavior |
|---|---|
| `npm start` | Starts `src/app` through `nodemon` and `ts-node-dev` |
| `npm run dev` | Same command as `start` |
| `npm run build` | Runs Webpack with `webpack.config.js` |
| `npm run prod` | Runs `node dist/app` |
| `npm test` | Deliberately exits with “no test specified” |

Run `npm run build` before `npm run prod` so that `dist/app.js` exists.

## 2. TypeScript and bundling configuration

`tsconfig.json`:

- `strict: true`
- `target: es6`
- `module` and `moduleResolution`: `node16`
- `rootDir: ./src`
- `outDir: ./es6`
- `esModuleInterop: true`
- `skipLibCheck: true`
- Decorator metadata options are enabled, although no decorators are visible in the supplied source.

`webpack.config.js`:

- Entry point: `./src/app.ts`.
- Target: `node`.
- TypeScript loader: `ts-loader`.
- Extensions: `.ts` and `.js`.
- Output: `dist/app.js`.
- Includes `BundleAnalyzerPlugin`.

The Webpack build configuration and TypeScript compiler configuration serve different output workflows; the `build` script uses Webpack.

## 3. Environment configuration

The `.env` file in the uploaded archive contains MongoDB-related settings and an environment selector. Its values are intentionally not reproduced here.

The source reads:

- `MONGO_URI`
- `MONGO_DB`
- `ENV`

`src/config.ts` provides base values, including port `8080`, CORS/allow configuration, logging settings, middleware logging settings, and MongoDB defaults. The exported `env` map has `sit` and `prd` profiles.

`src/app.ts` calls:

```ts
const cfg = merge(config, process.env, env, process.env.ENV)
```

Do not assume merge precedence or nested-merge behavior without consulting the installed `config-plus` package. In particular, the logger is created from `config.log` before `.env` is loaded and before `cfg` is built; verify this ordering if runtime log-level overrides are expected to affect initial logger creation.

### Secret handling

The checked-in source contains a hard-coded MongoDB URI fallback. Treat connection strings as secrets even if they appear to be demo credentials. For any non-disposable environment:

- Read the connection string from the environment or a secret manager.
- Remove the hard-coded credential from source.
- Keep `.env` out of version control.
- Rotate any credential that has been exposed beyond its intended audience.
- Never print the connection URI in diagnostic logs.

## 4. Middleware and CORS

The Express app registers:

1. `allow(cfg.allow)` from `express-web-kit`.
2. `express.json()`.
3. `middleware.log` from `MiddlewareLogger`.

The configured allow options currently include wildcard origin and headers, credentials enabled, and a set of common HTTP methods. Review these settings for the deployment origin/security requirements rather than copying them blindly to production.

The middleware logger receives callbacks that:

- populate request and correlation IDs;
- mask top-level phone/email values in request bodies;
- mask top-level phone/email values in response JSON.

The masking callbacks do not provide general-purpose field discovery or cryptographic encryption. Sensitive nested fields and other PII are not visibly handled by these callbacks.

## 5. Startup and failure behavior

The server starts only after MongoDB connection succeeds. A connection failure is caught and written to `console.log`; no listener is started on that path. The source does not show retry behavior, graceful shutdown handling, or process termination on startup failure.

Do not claim these operational features exist unless they are implemented elsewhere.

## 6. Tests and verification

No test files or testing framework are present in the supplied archive. The `test` script is a placeholder that exits with an error.

For a code change:

- Run `npm ci` in a clean environment to install the lockfile-defined dependencies.
- Run `npm run build` to check the Webpack/TypeScript build.
- Add appropriate tests when introducing behavior; select and configure a test framework as part of that work rather than assuming one already exists.
- Do not report the build or tests as successful unless they were actually executed.

## 7. Dependency notes

The lockfile records versions for the project's direct dependencies. Among the direct dependencies are Express 5, MongoDB 7, `mongodb-kit`, `onecore`, `validation-core`, `express-web-kit`, `middleware-logging`, and the `core-ts` configuration/logging packages.

Some helper packages declare Express 4 dependencies in their own package metadata while the application declares Express 5. Treat cross-package Express compatibility as something to verify with the installed dependency tree and build/runtime checks before changing versions.
