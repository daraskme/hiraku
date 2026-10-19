(function () {
  'use strict';
  const NOTES_KEY = 'hiraku.notes.v1';
  const DATA_KEYS = [
    'hiraku.progress.v1', 'hiraku.bookmarks.v1', 'hiraku.englishWords.v1',
    'hiraku.stars.v1', 'hiraku.badges.v1', 'hiraku.goals.v1', 'hiraku.sceneBg.v1',
    NOTES_KEY, 'theme', 'fontSize', 'ruby', 'contrast', 'writing',
  ];
  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; }
    catch (_) { return fallback; }
  }
  function notes() {
    const value = read(NOTES_KEY, {});
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  function key(collection, id) {
    if (!/^[\w-]+$/.test(collection) || !/^[\w-]+$/.test(id)) throw new Error('Invalid lesson');
    return collection + ':' + id;
  }
  function getNote(collection, id) { return notes()[key(collection, id)] || null; }
  function saveNote(note) {
    if (typeof note.text !== 'string' || note.text.length > 8000) throw new Error('Invalid note');
    const all = notes();
    const lessonKey = key(note.collection, note.id);
    if (note.text.trim()) {
      all[lessonKey] = { collection: note.collection, id: note.id, title: String(note.title || note.id), text: note.text, updatedAt: Date.now() };
    } else {
      delete all[lessonKey];
    }
    localStorage.setItem(NOTES_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('hiraku:local-data'));
    return all[lessonKey] || null;
  }
  function listNotes() {
    return Object.values(notes()).filter(n => n && typeof n.text === 'string' && n.text.trim())
      .map(n => ({ ...n, preview: n.text.slice(0, 100) })).sort((a, b) => b.updatedAt - a.updatedAt);
  }
  function exportData() {
    const data = {};
    for (const name of DATA_KEYS) {
      const value = localStorage.getItem(name);
      if (value !== null) data[name] = value;
    }
    return { version: 1, exportedAt: new Date().toISOString(), data };
  }
  function importData(payload) {
    if (!payload || payload.version !== 1 || !payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) throw new Error('Invalid backup');
    const entries = Object.entries(payload.data).filter(([name]) => DATA_KEYS.includes(name));
    if (!entries.length || entries.some(([, value]) => typeof value !== 'string')) throw new Error('Invalid backup');
    const previous = entries.map(([name]) => [name, localStorage.getItem(name)]);
    try {
      for (const [name, value] of entries) localStorage.setItem(name, value);
    } catch (error) {
      for (const [name, value] of previous) {
        try { if (value === null) localStorage.removeItem(name); else localStorage.setItem(name, value); } catch (_) {}
      }
      throw error;
    }
    window.dispatchEvent(new CustomEvent('hiraku:local-data'));
    return entries.length;
  }
  window.HirakuLocal = { getNote, saveNote, listNotes, exportData, importData };
})();
