import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_DEFINITIONS } from '../scripts/run-private-profile.mjs';

test('all profiles are fixed data with no user-supplied commands', () => {
  for (const [name, definition] of Object.entries(PROFILE_DEFINITIONS)) {
    assert.ok(name.length > 0);
    assert.ok(Array.isArray(definition.markers));
    assert.ok(Array.isArray(definition.commands));
    assert.ok(definition.commands.length > 0);
    for (const [command, args] of definition.commands) {
      assert.equal(command, 'npm');
      assert.ok(Array.isArray(args));
      assert.ok(args.length > 0);
    }
  }
});

test('Codex and WorkBuddy profiles require explicit client and MCP evidence', () => {
  assert.deepEqual(PROFILE_DEFINITIONS['codex-integration'].markers, ['codex', 'mcp']);
  assert.deepEqual(PROFILE_DEFINITIONS['workbuddy-integration'].markers, ['workbuddy', 'mcp']);
});

test('main release includes application and contract gates', () => {
  const commands = PROFILE_DEFINITIONS['main-release'].commands.map(([command, args]) => `${command} ${args.join(' ')}`);
  assert.ok(commands.includes('npm test'));
  assert.ok(commands.includes('npm run typecheck'));
  assert.ok(commands.includes('npm run build'));
  assert.ok(commands.includes('npm run contracts:compile'));
  assert.ok(commands.includes('npm run contracts:test'));
});
