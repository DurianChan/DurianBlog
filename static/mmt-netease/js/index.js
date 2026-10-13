/**
 * javascript for shortcode mmt-netease
 * @author @Lruihao (https://lruihao.cn)
 */
const RNC = new (function () {
  const $music = document.querySelector('.netease-music');
  const $comment = document.querySelector('.comment-163');
  const $loading = document.querySelector('.loading-indicator-wrapper');
  let lastMusic = void 0;
  let timer = void 0;
  const TIME_OUT = 60;

  /**
   * 获取随机网易云评论
   * @param {Boolean} [autoplay=false] 是否自动播放
   * @param {Boolean} [current=false] 是否播放当前评论的音乐
   * @name RNC#getRandomComment
   */
  this.getRandomComment = (autoplay = false, current = false) => {
    $comment.classList.add('is-loading');
    $loading.classList.remove('d-none');
    fetch(`https://cell-api.vercel.app/netease/comment?mid=${$music.dataset.mid}`, { signal: AbortSignal.timeout(15000) })
      .then(response => response.json())
      .then((comment) => {
        if (!comment.data?.content) throw new Error('评论服务暂时没有返回内容');
        const nickname = comment.data?.nickname || '未知用户';
        const musicURL = comment.data?.musicUrl;
        if (comment.data.picUrl) {
          $comment.querySelector('.pic-backdrop').style.backgroundImage = `url(${comment.data.picUrl.replace(/^http:/, 'https:')})`;
        }
        if (comment.data.avatarUrl) {
          const $avatar = $comment.querySelector('.comment-avatar');
          $avatar.alt = `${nickname}'s avatar`;
          $avatar.addEventListener('error', () => $avatar.classList.add('d-none'), { once: true });
          $avatar.src = comment.data.avatarUrl.replace(/^http:/, 'https:');
          $avatar.classList.remove('d-none');
        }
        $comment.querySelector('.comment-nickname').textContent = nickname;
        $comment.querySelector('.comment-time').textContent = comment.data.timeStr;
        $comment.querySelector('.comment-liked').textContent = comment.data.likedCount;
        $comment.querySelector('.comment-content').textContent = comment.data.content;
        $comment.querySelector('.music-name').textContent = comment.data?.musicName;
        $comment.querySelector('.artists-name').textContent = comment.data?.artist;
        if (!musicURL || !current) { return; }
        if (!lastMusic || (lastMusic !== musicURL)) {
          const $player = document.createElement('meting-js');
          $player.setAttribute('auto', musicURL);
          $player.setAttribute('autoplay', autoplay);
          $music.dataset.fixed && $player.setAttribute('fixed', $music.dataset.fixed);
          $music.dataset.mini && $player.setAttribute('mini', $music.dataset.mini);
          $music.dataset.volume && $player.setAttribute('volume', $music.dataset.volume);
          $music.innerHTML = '';
          $music.appendChild($player);
          lastMusic = musicURL;
        }
      }).catch((error) => {
        console.error('Error fetching comment:', error);
        $comment.querySelector('.comment-content').innerHTML = '获取评论失败，请稍后再试...';
      }).finally(() => {
        $loading.classList.add('d-none');
        requestAnimationFrame(() => {
          $comment.classList.remove('is-loading');
        });
      });
  };

  /**
   * require APlayer and MetingJS
   */
  this.getRequire = () => {
    if (typeof MetingJSElement === 'undefined') {
      const APlayer = document.createElement('script');
      const Meting = document.createElement('script');
      APlayer.src = 'https://unpkg.com/aplayer/dist/APlayer.min.js';
      Meting.src = 'https://unpkg.com/meting@2/dist/Meting.min.js';
      const s = document.getElementsByTagName('script')[0];
      s.parentNode.insertBefore(APlayer, s);
      s.parentNode.insertBefore(Meting, s);
    }
  };

  this.refresh = (autoplay = false, current = false) => {
    this.getRandomComment(autoplay, current);
    if (timer) {
      clearInterval(timer);
    }
    timer = setInterval(() => {
      this.getRandomComment(autoplay, current);
    }, TIME_OUT * 1000);
  };

  /**
   * 初始化 mmt-netease shortcode
   * @name RNC#initRandomComment
   */
  this.initMMTNetease = () => {
    if (!$music || !$comment) {
      return;
    }
    // APlayer and MetingJS are served locally and loaded in order by the shortcode.
    $comment.addEventListener('click', () => {
      this.refresh($music.dataset.autoplay === 'true', $music.dataset.current === 'true');
    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // 进入视口时开始获取评论
          this.refresh();
          // 取消观察
          observer.disconnect();
        }
      });
    }, { threshold: 0.1 });
    const target = document.querySelector('.section-comment');
    if (target) {
      observer.observe(target);
    }
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  RNC.initMMTNetease();
});
