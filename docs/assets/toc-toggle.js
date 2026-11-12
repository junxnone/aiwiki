// A single "TOC" button toggles the page TOC (docsify-plugin-toc).
// The choice is remembered in localStorage; without a saved choice the TOC
// starts expanded on wide screens (>= 1300px) and collapsed on narrow ones.
// The list is as wide as its longest title (see toc-toggle.css for the
// min/max); its measured width is published as --toc-w so that the content
// can reserve exactly that much room on wide screens. Every entry also gets a
// title attribute with the full heading text (long ones are ellipsized).
(function () {
  var KEY = 'toc-collapsed';
  var btn = null;
  var observer = null;

  function getSaved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function save(collapsed) {
    try { localStorage.setItem(KEY, collapsed ? '1' : '0'); } catch (e) { }
  }

  function isCollapsed() {
    var v = getSaved();
    return v === null ? window.innerWidth < 1300 : v === '1';
  }

  // publish the list width for the content padding (only while it is shown)
  function updateWidth() {
    var aside = document.querySelector('.toc-nav');
    if (!aside || document.body.classList.contains('toc-collapsed')) return;
    var w = Math.ceil(aside.getBoundingClientRect().width);
    if (w > 0) document.documentElement.style.setProperty('--toc-w', w + 'px');
  }

  function apply() {
    var collapsed = isCollapsed();
    document.body.classList.toggle('toc-collapsed', collapsed);
    if (btn) {
      btn.setAttribute('aria-expanded', String(!collapsed));
      btn.title = collapsed ? 'Show TOC' : 'Hide TOC';
    }
    updateWidth();
  }

  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = (window.$docsify.plugins || []).concat(function (hook) {
    hook.mounted(function () {
      btn = document.createElement('button');
      btn.id = 'toc-toggle';
      btn.type = 'button';
      btn.textContent = 'TOC';
      btn.addEventListener('click', function () {
        save(!document.body.classList.contains('toc-collapsed'));
        apply();
      });
      document.body.appendChild(btn);
      apply();
      window.addEventListener('resize', apply);
    });

    hook.doneEach(function () {
      var aside = document.querySelector('.toc-nav');
      var hasToc = !!(aside && aside.querySelector('.page_toc'));

      // no headings on the page -> hide the button and reserve no room
      if (btn) btn.style.display = hasToc ? '' : 'none';
      document.body.classList.toggle('toc-empty', !hasToc);

      // full heading text as a tooltip (long titles are ellipsized)
      if (hasToc) {
        aside.querySelectorAll('.page_toc > div').forEach(function (item) {
          item.title = item.textContent.trim();
        });
      }

      // follow the list width as it changes (new page, font load, ...)
      if (aside && !observer && window.ResizeObserver) {
        observer = new ResizeObserver(updateWidth);
        observer.observe(aside);
      }
      updateWidth();
    });
  });
})();
