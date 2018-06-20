import * as Assert from 'assert'
import { DataAccessProvider, PgDataAccess, PgQueryInterface } from './index'

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
