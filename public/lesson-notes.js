(function () {
  const section = document.querySelector('[data-lesson-notes]');
  const editor = document.querySelector('[data-lesson-notes-editor]');
  const status = document.querySelector('[data-lesson-notes-status]');
  const counter = document.querySelector('[data-lesson-notes-count]');
  const article = document.querySelector('article[data-lesson-collection]');
  if (!section || !editor || !article || !window.HirakuLocal) return;
  const collection = article.dataset.lessonCollection;
  const id = article.dataset.lessonId;
  const title = article.dataset.lessonTitle;
  if (!collection || !id) return;
  let timer;
  function count() { if (counter) counter.textContent = editor.value.length + ' / 8000'; }
  function load() {
    editor.value = window.HirakuLocal.getNote(collection, id)?.text || '';
    count();
  }
  function save() {
    clearTimeout(timer);
    timer = null;
    try {
      window.HirakuLocal.saveNote({ collection, id, title, text: editor.value });
      if (status) status.textContent = 'このブラウザーに保存しました';
      if (editor.value.trim().length >= 20 && window.HirakuBadges) window.HirakuBadges.award(collection, id, 'notes-written', title);
    } catch (_) {
      if (status) status.textContent = '保存できませんでした。ブラウザーの保存領域を確認してください。';
    }
  }
  editor.addEventListener('input', () => {
    count();
    clearTimeout(timer);
    if (status) status.textContent = '入力中…';
    timer = setTimeout(save, 500);
  });
  editor.addEventListener('blur', () => { if (timer) save(); });
  window.addEventListener('beforeunload', () => { if (timer) save(); });
  window.addEventListener('storage', event => { if (event.key === 'hiraku.notes.v1' && document.activeElement !== editor) load(); });
  load();
})();
