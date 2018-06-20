import * as Assert from 'assert'
import * as Path from 'path'
import { DataAccessProvider, PgDataAccess, PgQueryInterface, TemplateProvider } from './index'

describe('flock-pg', function () {
  const dap = new DataAccessProvider()
  let da: PgDataAccess = null
  let qi: PgQueryInterface = null

  beforeEach(async function () {
    da = await dap.provide()
    qi = da['qi'] // the QueryInterface
  })

  afterEach(async function () {
    qi.query({
      text: `DROP TABLE IF EXISTS ${da.migrationTableName}`
    })
    await da.close()
  })

  describe('TemplateProvider', function () {
    it('should provide a template file name when given a migration type that matches a template name', async function () {
      const tp = new TemplateProvider()
      let fileName = await tp.provideFileName('create-table')
      Assert.strictEqual(fileName, Path.resolve(__dirname, './templates/create-table.ejs'))
      fileName = await tp.provideFileName('alter-table')
      Assert.strictEqual(fileName, Path.resolve(__dirname, './templates/alter-table.ejs'))
      fileName = await tp.provideFileName('other')
      Assert.strictEqual(fileName, Path.resolve(__dirname, './templates/other.ejs'))
    })

    it('should reject when given a migration type that does not match a template name', async function () {
      const tp = new TemplateProvider()
      try {
        await tp.provideFileName('nope')
      } catch (error) {
        Assert.strictEqual(error.code, 'UNSUPPORTED_MIGRATION_TYPE')
      }
    })
  })

  describe('DataAccessProvider#provide', function () {
    it('should connect to the DB and acquire application lock', async function () {
      Assert.strictEqual(dap.migrationTableName, 'migration')
    })
  })

  describe('PgDataAccess', function () {
    describe('#getMigratedMigrations', function () {
      it('should retrieve migrated migrations', async function () {
        await qi.query({
          text:
            `CREATE TABLE IF NOT EXISTS "${da.migrationTableName}" (
              id varchar(512),
              created_at timestamp DEFAULT current_timestamp,
              PRIMARY KEY(id)
            )`
        })
        await qi.query({
          text: `INSERT INTO "${da.migrationTableName}" (id) VALUES($1)`,
          values: [ 'one' ]
        })
        const migrated = await da.getMigratedMigrations()
        Assert.deepStrictEqual(migrated.map(x => x.id), [ 'one' ])
        Assert.ok(migrated[0].migratedAt instanceof Date)
      })
    })

    describe('#migrate', function () {
      it('should migrate a migration', async function () {
        await da.migrate('two', qi => {
          /* do nothing */
          return Promise.resolve()
        })
        const migrated = await da.getMigratedMigrations()
        Assert.deepStrictEqual(migrated.map(x => x.id), [ 'two' ])
        Assert.ok(migrated[0].migratedAt instanceof Date)
      })
    })

    describe('#rollback', function () {
      it('should rollback a migration', async function () {
        await da.migrate('two', qi => {
          /* do nothing */
          return Promise.resolve()
        })
        await da.rollback('two', qi => {
          /* do nothing */
          return Promise.resolve()
        })
        const migrated = await da.getMigratedMigrations()
        Assert.strictEqual(migrated.length, 0)
      })
    })
  })
})
