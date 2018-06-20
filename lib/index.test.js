"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Assert = require("assert");
const index_1 = require("./index");
describe('flock-pg', function () {
    const dap = new index_1.DataAccessProvider();
    let da = null;
    let qi = null;
    beforeEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            da = yield dap.provide();
            qi = da['qi']; // the QueryInterface
        });
    });
    afterEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            qi.query({
                text: `DROP TABLE IF EXISTS ${da.migrationTableName}`
            });
            yield da.close();
        });
    });
    describe('DataAccessProvider#provide', function () {
        it('should connect to the DB and acquire application lock', function () {
            return __awaiter(this, void 0, void 0, function* () {
                Assert.strictEqual(dap.migrationTableName, 'migration');
            });
        });
    });
    describe('PgDataAccess', function () {
        describe('#getMigratedMigrations', function () {
            it('should retrieve migrated migrations', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield qi.query({
                        text: `CREATE TABLE IF NOT EXISTS "${da.migrationTableName}" (
              id varchar(512),
              created_at timestamp DEFAULT current_timestamp,
              PRIMARY KEY(id)
            )`
                    });
                    yield qi.query({
                        text: `INSERT INTO "${da.migrationTableName}" (id) VALUES($1)`,
                        values: ['one']
                    });
                    const migrated = yield da.getMigratedMigrations();
                    Assert.deepStrictEqual(migrated.map(x => x.id), ['one']);
                    Assert.ok(migrated[0].migratedAt instanceof Date);
                });
            });
        });
        describe('#migrate', function () {
            it('should migrate a migration', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield da.migrate('two', qi => {
                        /* do nothing */
                        return Promise.resolve();
                    });
                    const migrated = yield da.getMigratedMigrations();
                    Assert.deepStrictEqual(migrated.map(x => x.id), ['two']);
                    Assert.ok(migrated[0].migratedAt instanceof Date);
                });
            });
        });
        describe('#rollback', function () {
            it('should rollback a migration', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield da.migrate('two', qi => {
                        /* do nothing */
                        return Promise.resolve();
                    });
                    yield da.rollback('two', qi => {
                        /* do nothing */
                        return Promise.resolve();
                    });
                    const migrated = yield da.getMigratedMigrations();
                    Assert.strictEqual(migrated.length, 0);
                });
            });
        });
    });
});
