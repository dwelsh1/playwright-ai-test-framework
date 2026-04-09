import { test as base, mergeTests, request } from '@playwright/test';
import { test as pageObjectFixture } from './page-object-fixture';
import { test as pwApiFixture } from '../api/pw-api-fixture';
import { test as helperFixture } from '../helper/helper-fixture';
import { test as networkMockFixture } from '../network/network-mock-fixture';
import { test as a11yFixture } from '../accessibility/a11y-fixture';

const test = mergeTests(
  pageObjectFixture,
  pwApiFixture,
  helperFixture,
  networkMockFixture,
  a11yFixture,
);

const expect = base.expect;
export { test, expect, request };
