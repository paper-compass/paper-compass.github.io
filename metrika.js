/* Яндекс Метрика для https://paper-compass.github.io/ — счётчик 114133564.
   Цели (тип «JavaScript-событие»):
     litres  — клик по любой ссылке на Литрес;
     print   — печать (кнопка «Печать» или Ctrl+P);
     trainer — открыт тренажёр или «Задача дня» (адреса #train-… и #daily… на главной).
   На других адресах (превью, локальная копия) счётчик не запускается,
   window.PC_GOAL остаётся пустой функцией. */
(function () {
  var ID = 114133564;
  window.PC_GOAL = function () {};
  if (location.hostname !== 'paper-compass.github.io') return;

  (function (m, e, t, r, i, k, a) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments) };
    m[i].l = 1 * new Date();
    for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return } }
    k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a)
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=' + ID, 'ym');
  ym(ID, 'init', { ssr: true, trackHash: true, clickmap: true, referrer: document.referrer, url: location.href, accurateTrackBounce: true, trackLinks: true });

  /* одна цель не чаще раза в 3 секунды: кнопка печати и событие печати не считаются дважды */
  var last = {};
  function reach(n, cb) {
    var t = Date.now();
    if (last[n] && t - last[n] < 3000) return false;
    last[n] = t;
    try { ym(ID, 'reachGoal', n, {}, cb) } catch (e) {}
    return true;
  }

  /* страницы тем зовут PC_GOAL из topic.js; «trainer» считаем там, где тренажёр открывается */
  window.PC_GOAL = function (n) { if (n !== 'trainer') reach(n) };

  addEventListener('beforeprint', function () { reach('print') });

  /* Литрес: переход в той же вкладке ждёт отправки цели, но не дольше 0,4 с */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href*="litres.ru"]') : null;
    if (!a) return;
    var same = e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && !e.defaultPrevented && (!a.target || a.target === '_self');
    if (!same) { reach('litres'); return }
    e.preventDefault();
    var href = a.href, gone = false;
    function go() { if (!gone) { gone = true; location.href = href } }
    if (reach('litres', go)) setTimeout(go, 400); else go();
  }, true);

  function route() { if (/^#(train-|daily)/.test(location.hash)) reach('trainer') }
  addEventListener('hashchange', route);
  route();
})();
