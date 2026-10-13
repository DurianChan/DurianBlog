(() => {
  const base = document.currentScript.dataset.base;
  const options = document.querySelector('.plugins-live2d-data').dataset;
  const minWidth = parseInt(options.minwidth, 10) || 1024;
  if (window.innerWidth < minWidth || typeof initWidget !== 'function') return;
  document.documentElement.style.setProperty('--blog-live2d-width', `${parseInt(options.width, 10) || 200}px`);
  document.documentElement.style.setProperty('--blog-live2d-height', `${parseInt(options.height, 10) || 220}px`);
  const [side, distance] = options.position.split(':');
  document.documentElement.style.setProperty('--blog-live2d-left', side === 'right' ? 'auto' : `${parseInt(distance, 10) || 12}px`);
  document.documentElement.style.setProperty('--blog-live2d-right', side === 'right' ? `${parseInt(distance, 10) || 12}px` : 'auto');
  initWidget({
    isLocalModel: true,
    waifuPath: `${base}waifu-tips.json`,
    modelsPath: `${base}model/`,
    modelListPath: `${base}model/model_list.json`,
    tools: ['switch-model', 'switch-texture', 'photo', 'quit'],
  });
})();
