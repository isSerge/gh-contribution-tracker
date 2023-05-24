import { it } from 'node:test'
import * as assert from 'node:assert/strict'
import { main } from '../index';

it('dummy test', () => {
  assert.doesNotThrow(main);
});
