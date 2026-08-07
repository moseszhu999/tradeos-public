import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_DEFINITIONS } from '../scripts/run-private-profile.mjs';

const ALLOWED_NODE_COMMANDS = new Set([
  'node --check scripts/tradeos-ted-search-opportunities.mjs',
  'node --check scripts/tradeos-world-bank-procurement-opportunities.mjs',
]);

const SHELL_META = /[;&|`$<>\n\r]/;

test('all profiles use fixed reviewed commands only', () => {
  const observedNodeCommands = new Set();

  for (const [name, definition] of Object.entries(PROFILE_DEFINITIONS)) {
    assert.ok(name.length > 0);
    assert.ok(Array.isArray(definition.commands));
    assert.ok(definition.commands.length > 0);

    for (const [command, args] of definition.commands) {
      assert.ok(command === 'npm' || command === 'node');
      assert.ok(Array.isArray(args));
      assert.ok(args.length > 0);
      assert.ok(args.every((arg) => typeof arg === 'string' && arg.length > 0 && !SHELL_META.test(arg)));

      if (command === 'node') {
        assert.equal(args.length, 2);
        assert.equal(args[0], '--check');
        const serialized = `${command} ${args.join(' ')}`;
        assert.ok(ALLOWED_NODE_COMMANDS.has(serialized));
        observedNodeCommands.add(serialized);
        continue;
      }

      assert.ok(['ci', 'test', 'run'].includes(args[0]));
    }
  }

  assert.deepEqual(observedNodeCommands, ALLOWED_NODE_COMMANDS);
});

test('Codex and WorkBuddy profiles require canonical implementation and dedicated tests', () => {
  const codex = PROFILE_DEFINITIONS['codex-integration'].evidence;
  const workbuddy = PROFILE_DEFINITIONS['workbuddy-integration'].evidence;

  for (const evidence of [codex, workbuddy]) {
    assert.ok(evidence.requiredFiles.includes('app/api/integrations/agents/mcp/route.ts'));
    assert.ok(evidence.requiredFiles.includes('lib/tradeos-agent-gateway/context.ts'));
    assert.ok(evidence.requiredFiles.includes('lib/tradeos-agent-gateway/mcp-server.ts'));
    assert.ok(evidence.requiredFiles.includes('tests/tradeos-agent-gateway/mcp-contract.test.ts'));
  }

  assert.ok(codex.requiredFiles.includes('tests/tradeos-agent-gateway/codex-integration.test.ts'));
  assert.ok(workbuddy.requiredFiles.includes('tests/tradeos-agent-gateway/workbuddy-integration.test.ts'));
});

test('main release requires at least one real Agent client integration', () => {
  const evidence = PROFILE_DEFINITIONS['main-release'].evidence;
  assert.ok(Array.isArray(evidence.anyOf));
  assert.equal(evidence.anyOf.length, 2);
  assert.ok(evidence.anyOf[0].requiredFiles.includes('tests/tradeos-agent-gateway/codex-integration.test.ts'));
  assert.ok(evidence.anyOf[1].requiredFiles.includes('tests/tradeos-agent-gateway/workbuddy-integration.test.ts'));
});

test('main release includes application and contract gates', () => {
  const commands = PROFILE_DEFINITIONS['main-release'].commands.map(([command, args]) => `${command} ${args.join(' ')}`);
  assert.ok(commands.includes('npm test'));
  assert.ok(commands.includes('npm run typecheck'));
  assert.ok(commands.includes('npm run build'));
  assert.ok(commands.includes('npm run contracts:compile'));
  assert.ok(commands.includes('npm run contracts:test'));
});
