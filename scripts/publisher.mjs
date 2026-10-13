import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash, randomBytes } from 'node:crypto';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';

const exec = promisify(execFile);
const allowed = file => file.startsWith('content/') || file.startsWith('static/images/uploads/');

export async function systemProxy() {
  if (process.env.HTTPS_PROXY || process.env.https_proxy) return process.env.HTTPS_PROXY || process.env.https_proxy;
  if (process.platform !== 'win32') return '';
  try {
    const key = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings';
    const options = { windowsHide: true };
    const enabled = await exec('reg', ['query', key, '/v', 'ProxyEnable'], options);
    if (!/REG_DWORD\s+0x1\b/.test(enabled.stdout)) return '';
    const result = await exec('reg', ['query', key, '/v', 'ProxyServer'], options);
    const value = result.stdout.match(/REG_SZ\s+(.+)/)?.[1].trim() || '';
    const proxy = value.includes('=') ? value.match(/(?:^|;)https=([^;]+)/)?.[1] : value;
    return proxy ? (/^https?:\/\//.test(proxy) ? proxy : `http://${proxy}`) : '';
  } catch { return ''; }
}

export function createPublisher(root, { remoteURL = 'https://github.com/DurianChan/DurianBlog.git', proxy = '' } = {}) {
  let busy = false;
  const git = async (...args) => {
    try {
      const result = await exec('git', ['--literal-pathspecs', ...(proxy ? ['-c', `http.proxy=${proxy}`] : []), ...args], {
        cwd: root, windowsHide: true, timeout: 90000, maxBuffer: 8 * 1024 * 1024,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' },
      });
      return result.stdout;
    } catch (error) {
      throw new Error(`Git 操作失败：${(error.stderr || error.message).trim()}`);
    }
  };
  const statePath = async () => path.resolve(root, (await git('rev-parse', '--git-path', 'durian-publish.json')).trim());
  const readPending = async () => {
    try { return JSON.parse(await readFile(await statePath(), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  };
  const clearPending = async () => { await unlink(await statePath()).catch(error => { if (error.code !== 'ENOENT') throw error; }); };

  async function snapshot() {
    if ((await git('branch', '--show-current')).trim() !== 'main') throw new Error('请先切换到 main 分支。');
    if ((await git('remote', 'get-url', '--push', 'origin')).trim() !== remoteURL) throw new Error('origin 不是配置的博客仓库，请先检查远程地址。');
    if ((await git('remote', 'get-url', 'origin')).trim() !== remoteURL) throw new Error('origin 的拉取地址与博客仓库不一致，请先检查远程地址。');
    const head = (await git('rev-parse', 'HEAD')).trim();
    const staged = await git('diff', '--cached', '--name-only', '-z');
    if (staged) throw new Error('存在已暂存的改动，请先在 GitHub Desktop 或 Git 中取消暂存，再使用此入口。');
    // Disable rename detection so both sides of a rename enter the reviewed list.
    const status = await git('-c', 'status.renames=false', 'status', '--porcelain=v1', '-z', '--untracked-files=all');
    const changes = status.split('\0').filter(Boolean).map(row => ({ status: row.slice(0, 2), path: row.slice(3) }));
    const files = changes.filter(file => allowed(file.path));
    const hash = createHash('sha256').update(head);
    for (const file of files) {
      hash.update(JSON.stringify(file));
      try {
        await readFile(path.join(root, file.path));
        file.blob = (await git('hash-object', '--', file.path)).trim();
        hash.update(file.blob);
      }
      catch (error) { if (error.code !== 'ENOENT') throw error; hash.update('deleted'); }
    }
    const pending = await readPending();
    if (pending && pending.commit !== head) throw new Error('上次发布后提交历史已变化，请先通过 GitHub Desktop 同步，再处理发布记录。');
    hash.update(JSON.stringify(pending));
    return { head, files, ignoredCount: changes.length - files.length, fingerprint: hash.digest('hex'), pending };
  }

  async function publish(fingerprint) {
    if (busy) throw new Error('正在发布，请等待本次操作结束。');
    busy = true;
    try {
      let current = await snapshot();
      if (current.fingerprint !== fingerprint) throw new Error('文件已发生变化，请重新打开发布窗口确认。');
      await git('fetch', 'origin', 'main');
      const remote = (await git('rev-parse', 'FETCH_HEAD')).trim();
      if (current.pending) {
        if (remote !== current.pending.parent && remote !== current.pending.commit) throw new Error('远程仓库已有新提交，请先通过 GitHub Desktop 同步；不会强制推送。');
        if (remote !== current.pending.commit) await git('push', 'origin', `${current.pending.commit}:refs/heads/main`);
        await clearPending();
        return { commit: current.pending.commit, retried: true, remaining: current.files.length };
      }
      if (remote !== current.head) throw new Error('本地与 GitHub 的提交不同步，请先在 GitHub Desktop 完成 Pull / Push，再发布文章。');
      if (!current.files.length) throw new Error('没有待发布的文章或图片改动。');
      current = await snapshot();
      if (current.fingerprint !== fingerprint) throw new Error('文件已发生变化，请重新确认发布内容。');
      const paths = current.files.map(file => file.path);
      await git('add', '--', ...paths);
      try {
        // Content can be saved by CMS while this operation runs. Verify the
        // staged bytes before committing the explicitly reviewed paths only.
        const stagedPaths = (await git('diff', '--cached', '--name-only', '-z')).split('\0').filter(Boolean).sort();
        if (JSON.stringify(stagedPaths) !== JSON.stringify([...paths].sort())) throw new Error('暂存区发生变化，请重新检查。');
        for (const file of current.files) {
          if (file.blob && (await git('rev-parse', `:${file.path}`)).trim() !== file.blob) throw new Error('文件在确认后发生变化，请重新确认。');
        }
        if ((await git('diff', '--name-only', '--', ...paths)).trim()) throw new Error('保存内容在暂存后又发生变化，请重新确认。');
        await git('commit', '-m', 'Publish blog content from local editor');
      } catch (error) {
        await git('reset', 'HEAD', '--', ...paths);
        throw error;
      }
      const commit = (await git('rev-parse', 'HEAD')).trim();
      await writeFile(await statePath(), JSON.stringify({ commit, parent: current.head, files: current.files }), 'utf8');
      try { await git('push', 'origin', `${commit}:refs/heads/main`); }
      catch (error) { throw new Error(`已保留本地提交，可点击“重试推送”。${error.message}`); }
      await clearPending();
      return { commit, remaining: 0 };
    } finally { busy = false; }
  }

  const token = randomBytes(32).toString('hex');
  async function handle(req, res, pathname) {
    if (!pathname.startsWith('/api/publish')) return false;
    const json = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
    const origin = `http://${req.headers.host}`;
    if ((req.headers.origin && req.headers.origin !== origin) || req.headers['sec-fetch-site'] === 'cross-site') { json(403, { error: '仅允许本地后台调用。' }); return true; }
    try {
      if (pathname === '/api/publish/status' && req.method === 'GET') json(200, { ...await snapshot(), token, busy });
      else if (pathname === '/api/publish' && req.method === 'POST') {
        if (req.headers.origin !== origin || req.headers['x-publish-token'] !== token || !req.headers['content-type']?.startsWith('application/json')) { json(403, { error: '请刷新后台后重试。' }); return true; }
        let body = '';
        for await (const chunk of req) { body += chunk; if (body.length > 2048) throw new Error('请求过大。'); }
        json(200, await publish(JSON.parse(body).fingerprint));
      } else json(405, { error: '不支持的请求。' });
    } catch (error) { json(400, { error: error.message }); }
    return true;
  }
  return { snapshot, publish, handle };
}
