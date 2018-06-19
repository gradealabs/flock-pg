.PHONY: test
test:
	@./node_modules/.bin/mocha \
		-r dotenv/config \
		-r ts-node/register \
		-r tsconfig-paths/register \
		--exit \
		./src/**/*.test.ts

.PHONY: build
build:
	@./node_modules/.bin/tsc -p .
	@cp -R src/flock-cli/templates lib/flock-cli
	@cp -R src/flock-pg/templates lib/flock-pg

.PHONY: clean
clean:
	@rm -fr lib
