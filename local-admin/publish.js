(() => {
  const dialog = document.getElementById('publish-dialog');
  const status = document.getElementById('publish-status');
  const confirm = document.getElementById('publish-confirm');
  const close = document.getElementById('publish-close');
  const list = document.getElementById('publish-files');
  const actions = document.getElementById('publish-actions');
  let review;
  let running = false;
  async function request(url, options) {
    const response = await fetch(url, { cache: 'no-store', ...options });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '请求失败，请稍后重试。');
    return data;
  }
  async function refresh() {
    confirm.disabled = true;
    review = await request('/api/publish/status');
    list.replaceChildren();
    const files = review.pending ? review.pending.files : review.files;
    for (const file of files) {
      const item = document.createElement('li');
      const action = file.status.includes('D') ? '删除' : file.status === '??' ? '新增' : '修改';
      item.textContent = `${action}：${file.path}`;
      list.append(item);
    }
    document.getElementById('publish-extra').textContent = review.pending
      ? `本次仅重试已提交的内容；另外还有 ${review.files.length} 项本地改动，可在重试完成后另行发布。`
      : (review.ignoredCount ? `另有 ${review.ignoredCount} 项代码或配置改动，不包含在本次发布中。` : '');
    confirm.textContent = review.pending ? '重试推送' : '确认并推送';
    confirm.disabled = review.busy || (!review.files.length && !review.pending);
    return review.pending ? '上次提交尚未确认同步，可重试推送。' : review.files.length ? `待发布 ${review.files.length} 个文件。` : '没有待发布的内容。';
  }
  document.getElementById('publish-github').onclick = async () => {
    if (running) return;
    dialog.showModal(); actions.hidden = true; list.replaceChildren();
    status.textContent = '正在读取待发布内容…';
    try { status.textContent = await refresh(); } catch (error) { status.textContent = error.message; }
  };
  close.onclick = () => dialog.close();
  dialog.addEventListener('cancel', event => { if (running) event.preventDefault(); });
  confirm.onclick = async () => {
    if (!review || running) return;
    running = true; confirm.disabled = true; close.disabled = true;
    status.textContent = '正在提交并推送，请保持窗口开启…';
    try {
      const result = await request('/api/publish', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Publish-Token': review.token },
        body: JSON.stringify({ fingerprint: review.fingerprint }),
      });
      status.textContent = `已推送到 GitHub（${result.commit.slice(0, 7)}）。网站正在等待自动部署，请稍后查看。`;
      actions.hidden = false;
      if (result.remaining) status.textContent += '\n还有新保存的本地改动，关闭后重新打开此窗口即可继续发布。';
    } catch (error) {
      status.textContent = error.message;
      try { await refresh(); } catch { confirm.disabled = true; }
    } finally { running = false; close.disabled = false; }
  };
})();
