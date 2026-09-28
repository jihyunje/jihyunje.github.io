(() => {
  const videos = [...document.querySelectorAll('video[data-src]')];
  if (!videos.length) return;
  if (!('IntersectionObserver' in window)) {
    videos.filter((video) => video.controls).forEach((video) => { video.src = video.dataset.src; });
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const visibility = new Map(videos.map((video) => [video, 0]));
  const updatePlayback = () => {
    const active = document.hidden || reduceMotion.matches ? null : [...visibility].sort((a, b) => b[1] - a[1])[0];
    const selected = active && active[1] >= 0.45 ? active[0] : null;
    for (const video of videos) {
      if (video === selected) {
        if (!video.src) video.src = video.dataset.src;
        if (video.paused) {
          const attempt = video.play();
          if (attempt) attempt.then(() => {
            if (!video.paused) video.classList.add('is-playing');
          }).catch(() => {});
        }
      } else {
        video.pause();
        video.classList.remove('is-playing');
      }
    }
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => visibility.set(entry.target, entry.intersectionRatio));
    updatePlayback();
  }, { threshold: [0, 0.45, 0.65, 0.85, 1] });

  if (!reduceMotion.matches) {
    videos.forEach((video) => observer.observe(video));
  } else {
    videos.filter((video) => video.controls).forEach((video) => { video.src = video.dataset.src; });
  }
  document.addEventListener('visibilitychange', updatePlayback);
  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches) {
      videos.filter((video) => video.controls && !video.src).forEach((video) => { video.src = video.dataset.src; });
      videos.forEach((video) => {
        video.pause();
        video.classList.remove('is-playing');
      });
      observer.disconnect();
      visibility.forEach((_, video) => visibility.set(video, 0));
    } else {
      videos.forEach((video) => observer.observe(video));
    }
  });
})();
