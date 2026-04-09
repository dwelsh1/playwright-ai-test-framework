.PHONY: install setup lint test smoke regression a11y visual report clean

install:
	npm ci

setup: install
	npm run build:smart-reporter

lint:
	npm run lint
	npx tsc --noEmit

test:
	npm test

smoke:
	npm run test:smoke

regression:
	npx playwright test --project=chromium --grep "@regression"

a11y:
	npx playwright test --project=chromium --grep "@a11y"

visual:
	npx playwright test --project=chromium --grep "@visual"

report:
	npm run report:smart

clean:
	rm -rf playwright-report test-results allure-results .auth
