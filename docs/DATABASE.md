# Database Model and Persistence Status

## 1. Critical distinction: runtime database vs supplied SQL

The checked-in application is MongoDB-backed:

- `src/app.ts` calls `connectToDb(...)` from `mongodb-kit`.
- `src/context.ts` receives `Db` from the MongoDB driver.
- `src/user/repository.ts` extends `Repository` from `mongodb-kit` and passes the collection name `"users"`.
- No PostgreSQL client, connection pool, SQL query layer, migration tool, or SQL repository is present in the supplied project.

The SQL design below was supplied with the task. It is catalogued as a **PostgreSQL relational schema reference**. It is not evidence that these tables are deployed or that the application can query them.

Before implementing a feature from this schema, decide whether to keep MongoDB and model equivalent documents, or migrate/add PostgreSQL persistence. These require different repository implementations and infrastructure.

## 2. Implemented MongoDB user mapping

`MongoUserRepository` is declared as:

- Generic entity: `User`
- Identifier type: `string`
- Filter: `UserFilter`
- Collection: `users`
- Model metadata: `userModel`

The TypeScript `User` interface currently exposes:

| Property | Type | SQL counterpart in supplied design | Source notes |
|---|---|---|---|
| `id` | `string` | `users.id` (`varchar(40)`) | Marked as key, length 40 |
| `username` | `string` | `users.username` (`varchar(255)`) | Required, length 255 |
| `email` | `string` optional | `users.email` (`varchar(255)`) | Validation metadata says required, length 120; differs from SQL length |
| `phone` | `string` optional | `users.phone` (`varchar(45)`) | Validation metadata says required, length 14; differs from SQL length |
| `dateOfBirth` | `Date` optional | `users.date_of_birth` (`timestamptz`) | Maps to `date_of_birth`, type `datetime` |

This is a narrow model. The SQL table also has `gender`, `display_name`, name components, `status`, image/cover, headline, bio, website, occupation, company, location, interests, skills, achievements, works, educations, settings, language, date format, and password-age fields. They are not present in the current TypeScript `User` interface/model.

## 3. Supplied PostgreSQL schema inventory

The following inventory records the provided `CREATE TABLE` statements, key constraints, and seed statements. Names and types follow the supplied SQL. Relationships are described as apparent/domain relationships only because the supplied DDL does not declare foreign keys.

### 3.1 Company ratings

**`company_rates`**

- `rate_id varchar(40)` primary key
- `id varchar(80)`
- `author varchar(40) not null`
- `rate float not null`
- `time timestamptz`
- `review text`
- `useful_count integer default 0`
- `reply_count integer default 0`
- `histories jsonb[]`
- `anonymous boolean`
- Unique constraint: `(id, author)`

**`company_rate_comments`**

- `comment_id varchar(40)` primary key
- `rate_id varchar(40) not null`
- `user_id varchar(40) not null`
- `comment text`
- `time timestamptz`
- `updated_at timestamptz`
- `histories jsonb[]`
- `anonymous boolean`

**`company_rate_reactions`**

- `rate_id varchar(40)`
- `user_id varchar(40)`
- `time timestamptz`
- `reaction smallint`
- Primary key: `(rate_id, user_id)`

The supplied seed statement inserts rows into `company_info(id, follower_count)` for `nab`, `fpt-software`, `tma-solutions`, and `kbtg`. A `CREATE TABLE company_info` statement was not supplied.

### 3.2 Users and credentials

**`users`**

- `id varchar(40)` primary key
- `username varchar(255) not null`
- `email varchar(255) not null`
- `phone character varying(45)`
- `gender character(1)`
- `date_of_birth timestamp with time zone`
- `display_name varchar(255)`
- `given_name character varying(100)`
- `family_name character varying(100)`
- `middle_name character varying(100)`
- `status char(1) not null`
- `image_url varchar(500)`
- `cover_url varchar(500)`
- `headline character varying(500)`
- `bio character varying(3000)`
- `website character varying(255)`
- `occupation character varying(255)`
- `company character varying(255)`
- `location character varying(255)`
- `interests character varying[]`
- `skills jsonb[]`
- `achievements jsonb[]`
- `works jsonb[]`
- `educations jsonb[]`
- `settings jsonb`
- `language varchar(5)`
- `dateformat varchar(12)`
- `max_password_age integer`

**`passwords`**

- `id varchar(40)` primary key
- `password varchar(255)`
- `success_time timestamptz`
- `fail_time timestamptz`
- `fail_count integer`
- `locked_until_time timestamptz`
- `changed_time timestamptz`
- `history character varying[]`

**`passcodes`**

- `id varchar(40)` primary key
- `code varchar(500) not null`
- `expired_at timestamptz not null`

The supplied DDL does not specify foreign keys from `passwords` or `passcodes` to `users`.

### 3.3 User counters and relationships

**`user_info`**

- `id varchar(40)` primary key
- `follower_count bigint default 0`
- `following_count bigint default 0`

**`user_followers`**

- `id varchar(40) not null`
- `follower varchar(40) not null`
- `followed_at timestamptz not null`
- Primary key: `(id, follower)`

**`user_following`**

- `id varchar(40) not null`
- `following varchar(40) not null`
- `following_at timestamptz not null`
- Primary key: `(id, following)`

The two relationship tables appear to represent the two directions of a follow relationship. The DDL does not define a constraint or trigger to keep the two representations and the counters synchronized.

### 3.4 Skills and interests reference lists

**`skills`**

- `skill varchar(120)` primary key

**`interests`**

- `interest varchar(120)` primary key

### 3.5 Code masters, categories, and content

The supplied SQL includes `INSERT` statements for `code_masters`, but no `CREATE TABLE code_masters` statement. Seeded masters include:

- `language`: `en` / English and `vi` / Tiếng Việt.
- `date_format`: multiple format patterns with a `sequence` and status values `A` or `I`.

Do not infer the full `code_masters` table structure from these inserts alone.

**`categories`**

- `id varchar(40)` primary key
- `name varchar(255) not null`
- `status char(1) not null`
- `path varchar(255)`
- `resource_key varchar(255)`
- `icon varchar(255)`
- `sequence int not null`
- `type varchar(40)`
- `parent varchar(40)`
- `created_by varchar(40)`
- `created_at timestamptz`
- `updated_by varchar(40)`
- `updated_at timestamptz`
- `version integer`

Seeded top-level category IDs are `companies`, `news`, `jobs`, and `profiles`; each is inserted with status `A`. The seed script then sets `version = 1` for all rows in `categories`.

**`contents`**

- `id varchar(80) not null`
- `lang varchar(10) not null`
- `title varchar(255) not null`
- `body varchar(9500)`
- `published_at timestamptz`
- `tags character varying[]`
- `status char(1)`
- `created_by varchar(40)`
- `created_at timestamptz`
- `updated_by varchar(40)`
- `updated_at timestamptz`
- `version integer`
- Primary key: `(id, lang)`

### 3.6 Jobs

**`jobs`**

- `id varchar(40)` primary key
- `slug varchar(255)`
- `title varchar(300)`
- `description text`
- `original_link varchar(300)`
- `published_at timestamptz`
- `expired_at timestamptz`
- `company_id varchar(40)`
- `position varchar(100)`
- `quantity integer default 1`
- `location varchar(1000)`
- `applicant_count integer default 1`
- `skills character varying[]`
- `min_salary bigint`
- `max_salary bigint`
- `status char(1)`
- `created_by varchar(40)`
- `created_at timestamptz`
- `updated_by varchar(40)`
- `updated_at timestamptz`

**`saved_jobs`**

- `user_id varchar(40)`
- `id varchar(80)`
- `saved_at timestamptz`
- Primary key: `(user_id, id)`

### 3.7 Articles and saved articles

**`articles`**

- `id varchar(80)` primary key
- `slug varchar(255)` unique
- `title varchar(255) not null`
- `description varchar(1200) not null`
- `content text`
- `published_at timestamptz`
- `tags character varying[]`
- `thumbnail varchar(400)`
- `high_thumbnail varchar(400)`
- `author_id varchar(40)`
- `company_id varchar(80)`
- `status char(1)`
- `created_at timestamptz`

**`saved_articles`**

- `user_id varchar(40)`
- `id varchar(80)`
- `saved_at timestamptz`
- Primary key: `(user_id, id)`

### 3.8 Article ratings

**`article_info`**

- `id varchar(40)` primary key
- `rate real default 0`
- `rate1 integer default 0`
- `rate2 integer default 0`
- `rate3 integer default 0`
- `rate4 integer default 0`
- `rate5 integer default 0`
- `count integer default 0`
- `score integer default 0`

**`article_rates`**

- `rate_id varchar(40)` primary key
- `id varchar(40)`
- `author varchar(40) not null`
- `rate integer not null`
- `time timestamptz`
- `review text`
- `useful_count integer default 0`
- `reply_count integer default 0`
- `histories jsonb[]`
- `anonymous boolean`
- Unique constraint: `(id, author)`

**`article_rate_comments`**

- `comment_id varchar(40)` primary key
- `rate_id varchar(40) not null`
- `user_id varchar(40) not null`
- `comment text`
- `time timestamptz`
- `updated_at timestamptz`
- `histories jsonb[]`
- `anonymous boolean`

**`article_rate_reactions`**

- `rate_id varchar(40)`
- `user_id varchar(40)`
- `time timestamptz`
- `reaction smallint`
- Primary key: `(rate_id, user_id)`

## 4. Apparent domain relationships

The column names suggest the following relationships. These are not enforced by foreign keys in the supplied statements:

- `company_rates.id` → company identifier; `company_rates.author` → user identifier.
- `company_rate_comments.rate_id` → `company_rates.rate_id`; `company_rate_comments.user_id` → user identifier.
- `company_rate_reactions.rate_id` → `company_rates.rate_id`; `company_rate_reactions.user_id` → user identifier.
- `user_info.id`, `user_followers.id`, `user_following.id` → user identifier.
- `user_followers.follower` and `user_following.following` → user identifier.
- `jobs.company_id` → company identifier; `jobs.created_by` → user identifier.
- `saved_jobs.user_id` → user identifier; `saved_jobs.id` → job identifier.
- `articles.author_id` → user identifier; `articles.company_id` → company identifier.
- `saved_articles.user_id` → user identifier; `saved_articles.id` → article identifier.
- `article_rates.id` / `article_info.id` → article identifier; `article_rates.author` → user identifier.
- Article/company rate comment and reaction tables refer to their corresponding rate records and users.
- `categories.parent` appears to refer to another category.
- `contents.id` may identify localized content; the composite key allows one row per language.

Because the DDL omits FK declarations, validate actual constraints and lifecycle rules against the deployed database before relying on cascade behavior or referential integrity.

## 5. Schema observations to resolve before implementation

1. **Database mismatch:** runtime uses MongoDB while the supplied schema is PostgreSQL.
2. **Partial user model:** source `User` covers only five properties; SQL `users` includes many more.
3. **Validation/type mismatch:** `email` and `phone` are optional in the TypeScript interface but required in `userModel`.
4. **Length mismatches:** TypeScript validation uses email length 120 and phone length 14; SQL allows email 255 and phone 45.
5. **Identifier length differences:** `articles.id` is `varchar(80)`, while `article_rates.id` and `article_info.id` are `varchar(40)`.
6. **Job identifier difference:** `jobs.id` is `varchar(40)`, while `saved_jobs.id` is `varchar(80)`.
7. **Unprovided table definitions:** `company_info` and `code_masters` are referenced by seed statements, but their `CREATE TABLE` statements are absent.
8. **Duplicated follow representation:** both follower and following tables appear to record opposite views of a relationship; the DDL does not define synchronization.
9. **JSON structures unspecified:** shapes for `histories`, `skills`, `achievements`, `works`, `educations`, and `settings` are not defined beyond their SQL types.
10. **Status semantics unspecified:** seed rows use `A` and `I` in some places, but the supplied schema does not define a universal status-code contract.

AI agents must not silently reconcile these differences. Surface them when a feature depends on a specific interpretation.
