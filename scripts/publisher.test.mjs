import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createPublisher } from './publisher.mjs';

const exec = promisify(execFile);
test('content publishing, review protection, retry and HTTP authorization', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'durian-publish-test-'));
  const root = path.join(temp, 'work');
  const remote = path.join(temp, 'remote.git');
  await mkdir(root);
  const git = async (...args) => (await exec('git', args, { cwd: root, windowsHide: true })).stdout.trim();
  const put = async (file, value) => { await mkdir(path.dirname(path.join(root, file)), { recursive: true }); await writeFile(path.join(root, file), value); };
  await git('init', '--bare', remote);
  await git('init', '-b', 'main');
  await git('config', 'user.name', 'Publisher Test');
  await git('config', 'user.email', 'test@example.invalid');
  await git('config', 'core.autocrlf', 'false');
  await put('content/posts/first.md', 'Original');
  await put('content/posts/delete.md', 'Delete test');
  await put('hugo.toml', 'title = "test"');
  await git('add', '.'); await git('commit', '-m', 'Initial');
  await git('remote', 'add', 'origin', remote); await git('push', '-u', 'origin', 'main');
  const publisher = createPublisher(root, { remoteURL: remote });
  await put('content/posts/first.md', 'Updated');
  await put('content/posts/中文 文章/index.md', 'New article\r\n');
  await put('static/images/uploads/test.svg', '<svg/>');
  await unlink(path.join(root, 'content/posts/delete.md'));
  await put('hugo.toml', 'title = "Keep this local"');
  let snapshot = await publisher.snapshot();
  assert.equal(snapshot.files.length, 4); assert.equal(snapshot.ignoredCount, 1);
  const result = await publisher.publish(snapshot.fingerprint);
  assert.equal(await git('rev-parse', 'origin/main'), result.commit);
  assert.equal(await git('show', 'HEAD:hugo.toml'), 'title = "test"');
  assert.match(await git('status', '--porcelain'), /hugo.toml/);
  assert.equal((await publisher.snapshot()).files.length, 0);

  await put('content/posts/first.md', 'Next update');
  snapshot = await publisher.snapshot();
  await put('content/posts/first.md', 'Changed after review');
  await assert.rejects(publisher.publish(snapshot.fingerprint), /文件已发生变化/);
  await git('add', 'hugo.toml');
  await assert.rejects(publisher.snapshot(), /已暂存/);
  await git('reset', 'HEAD', '--', 'hugo.toml');

  // A rejected push must leave a retryable local commit, without re-committing.
  const hook = path.join(remote, 'hooks/pre-receive');
  await writeFile(hook, '#!/bin/sh\nexit 1\n', { mode: 0o755 });
  snapshot = await publisher.snapshot();
  await assert.rejects(publisher.publish(snapshot.fingerprint), /重试推送/);
  const pending = await publisher.snapshot();
  assert.ok(pending.pending);
  await unlink(hook);
  await put('content/posts/first.md', 'Saved after failed push');
  const retryReview = await publisher.snapshot();
  const retry = await publisher.publish(retryReview.fingerprint);
  assert.equal(retry.commit, pending.head); assert.equal(retry.remaining, 1);
  assert.equal(await git('show', 'origin/main:content/posts/first.md'), 'Changed after review');
  assert.equal(await readFile(path.join(root, 'content/posts/first.md'), 'utf8'), 'Saved after failed push');

  const server = http.createServer(async (req, res) => {
    if (!await publisher.handle(req, res, new URL(req.url, 'http://localhost').pathname)) res.writeHead(404).end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    assert.equal((await fetch(`${base}/api/publish/status`, { headers: { Origin: 'https://untrusted.example' } })).status, 403);
    assert.equal((await fetch(`${base}/api/publish`, { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: '{}' })).status, 403);
    const review = await (await fetch(`${base}/api/publish/status`)).json();
    assert.ok(review.token); assert.equal(review.files.length, 1);
    const response = await fetch(`${base}/api/publish`, {
      method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json', 'X-Publish-Token': review.token },
      body: JSON.stringify({ fingerprint: review.fingerprint }),
    });
    assert.equal(response.status, 200);
    assert.equal(await git('show', 'origin/main:content/posts/first.md'), 'Saved after failed push');
  } finally { await new Promise(resolve => server.close(resolve)); }

  // No force push or accidental publication of unrelated local commits.
  await git('add', 'hugo.toml'); await git('commit', '-m', 'Unrelated local commit');
  snapshot = await publisher.snapshot();
  await assert.rejects(publisher.publish(snapshot.fingerprint), /不同步/);
  console.log(`Verified with isolated temporary repository: ${temp}`);
});
