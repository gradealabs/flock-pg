# Flock Postgres

Flock Postgres is a Flock plugin for Postgres.

## Install

```
npm install gradealabs/flock-pg
```

## Usage

```js
// .flockrc.js
const { DefaultMigrator, NodeModuleMigrationProvider } = require('@gradealabs/flock')
const { DataAccessProvider, TemplateProvider } = require('@gradealabs/flock-pg')

const migrationDir = 'migrations'
const migrationTableName = 'migration'
const dap = new DataAccessProvider({ migrationTableName })
const mp = new NodeModuleMigrationProvider({ migrationDir })

exports.migrator = new DefaultMigrator(mp, dap)
exports.migrationDir = migrationDir
exports.templateProvider = new TemplateProvider()

```

## Migrations

When writing migrations that use `flock-pg` the `QueryInterface#query`
method can be used in a similar fashion as the query method from the [pg](https://node-postgres.com/features/queries)
module.

Example:
```js
exports.up = queryInterface => {
  const sql = 'SELECT * FROM user WHERE age = $1'
  const values = [ 1 ]
  return queryInterface.query({ text: sql, values })
}
```

The `QueryInterface#query` method accepts a query object with the following shape:

```ts
{
  text: string,
  values?: any[],
  name?: string
}
```

## API

Flock pg exports implementations of Flock's `DataAccessProvider` and `TemplateProvider`
as `DataAccessProvider` and `TemplateProvider` classes.

The `DataAccessProvider` class will connect to your Postgres DB by reading
the connection string from the `DATABASE_URL` environment variable. Optionally you
can override the behaviour by passing in the `connectionString` option to the
constructor.

```js
class DataAccessProvider implements Flock.DataAccessProvider {
  constructor ({
    migrationTableName = 'migration',
    acquireLock = true,
    connectionString = process.env.DATABASE_URL } = {})
}
```

Additionally, by default the `DataAccessProvider` will attempt to acquire an
application lock immediately after connecting to the database. This behaviour
can be overridden by setting the `acquireLock` option to `false`. Acquiring a
lock helps to prevent concurrent migrations from occuring.

See: https://devcenter.heroku.com/articles/release-phase
