// CMS Admin — vanilla JS, Firebase SDK
(function () {
  'use strict';

  // Firebase config — update these values from your Firebase console
  var firebaseConfig = {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'devanveljiwebsite.firebaseapp.com',
    projectId: 'devanveljiwebsite',
    storageBucket: 'devanveljiwebsite.appspot.com',
    messagingSenderId: '',
    appId: ''
  };

  firebase.initializeApp(firebaseConfig);
  var auth = firebase.auth();
  var db = firebase.firestore();

  var currentUser = null;
  var editingPostId = null;

  // --- Auth ---
  document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var email = document.getElementById('login-email').value;
    var password = document.getElementById('login-password').value;
    auth.signInWithEmailAndPassword(email, password)
      .then(function () { /* onAuthStateChanged handles it */ })
      .catch(function () {
        var err = document.getElementById('login-error');
        err.style.display = 'block';
        err.textContent = 'Invalid credentials.';
      });
  });

  document.getElementById('logout-btn').addEventListener('click', function () { auth.signOut(); });

  auth.onAuthStateChanged(function (user) {
    currentUser = user;
    if (user) {
      document.getElementById('login-section').classList.remove('active');
      document.getElementById('admin-section').classList.add('active');
      loadPosts();
      loadBooks();
      loadLinks();
    } else {
      document.getElementById('login-section').classList.add('active');
      document.getElementById('admin-section').classList.remove('active');
    }
  });

  // --- Tab Navigation ---
  document.querySelectorAll('.nav-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.nav-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(function (c) { c.style.display = 'none'; });
      document.getElementById('tab-' + tab.dataset.tab).style.display = 'block';
    });
  });

  // --- SHA-256 ---
  function sha256(str) {
    var buf = new TextEncoder().encode(str);
    return crypto.subtle.digest('SHA-256', buf).then(function (hash) {
      return Array.from(new Uint8Array(hash)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  }

  // --- Posts CRUD ---
  function loadPosts() {
    db.collection('posts').orderBy('date', 'desc').get().then(function (snap) {
      var tbody = document.getElementById('posts-table');
      tbody.innerHTML = '';
      var select = document.getElementById('link-post-select');
      select.innerHTML = '<option value="">Select a post...</option>';

      snap.forEach(function (doc) {
        var p = doc.data();
        var status = p.isPrivate ? 'private' : (p.isPublished ? 'published' : 'draft');
        var badgeClass = 'badge-' + status;
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + esc(p.title) + '</td>' +
          '<td>' + (p.date || '') + '</td>' +
          '<td><span class="badge ' + badgeClass + '">' + status + '</span></td>' +
          '<td><div class="btn-group">' +
          '<button class="btn btn-secondary edit-btn" data-id="' + doc.id + '">Edit</button>' +
          '<button class="btn btn-danger del-btn" data-id="' + doc.id + '">Delete</button>' +
          '</div></td>';
        tbody.appendChild(tr);

        // Add to link selector
        var opt = document.createElement('option');
        opt.value = doc.id;
        opt.textContent = p.title;
        select.appendChild(opt);
      });

      // Bind edit/delete
      tbody.querySelectorAll('.edit-btn').forEach(function (btn) {
        btn.addEventListener('click', function () { editPost(btn.dataset.id); });
      });
      tbody.querySelectorAll('.del-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (confirm('Delete this post?')) {
            db.collection('posts').doc(btn.dataset.id).delete().then(loadPosts);
          }
        });
      });
    });
  }

  function editPost(id) {
    db.collection('posts').doc(id).get().then(function (doc) {
      if (!doc.exists) return;
      var p = doc.data();
      editingPostId = id;
      document.getElementById('editing-post-id').value = id;
      document.getElementById('post-title').value = p.title || '';
      document.getElementById('post-date').value = p.date || '';
      document.getElementById('post-tags').value = (p.tags || []).join(', ');
      document.getElementById('post-markdown').value = p.markdown || '';
      document.getElementById('post-private').checked = !!p.isPrivate;
      document.getElementById('post-published').checked = p.isPublished !== false;
      document.getElementById('post-password').style.display = p.isPrivate ? 'block' : 'none';
      document.getElementById('post-password').value = '';
      document.getElementById('editor-title').textContent = 'Edit: ' + p.title;
      updatePreview();
      switchTab('editor');
    });
  }

  document.getElementById('new-post-btn').addEventListener('click', function () {
    editingPostId = null;
    document.getElementById('editing-post-id').value = '';
    document.getElementById('post-title').value = '';
    document.getElementById('post-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('post-tags').value = '';
    document.getElementById('post-markdown').value = '';
    document.getElementById('post-private').checked = false;
    document.getElementById('post-published').checked = true;
    document.getElementById('post-password').style.display = 'none';
    document.getElementById('editor-title').textContent = 'New Post';
    document.getElementById('post-preview').innerHTML = 'Preview will appear here...';
    switchTab('editor');
  });

  document.getElementById('post-private').addEventListener('change', function () {
    document.getElementById('post-password').style.display = this.checked ? 'block' : 'none';
  });

  document.getElementById('save-post-btn').addEventListener('click', function () {
    var title = document.getElementById('post-title').value.trim();
    if (!title) { alert('Title is required'); return; }

    var slug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    var markdown = document.getElementById('post-markdown').value;
    var isPrivate = document.getElementById('post-private').checked;
    var passwordVal = document.getElementById('post-password').value;

    // Build excerpt
    var excerpt = markdown
      .replace(/^---[\s\S]*?---\n/, '')
      .replace(/\$\$[\s\S]*?\$\$/g, '')
      .replace(/\$[^$]+\$/g, '')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);

    var wordCount = markdown.split(/\s+/).length;
    var readingTime = Math.ceil(wordCount / 200);

    var data = {
      slug: slug,
      title: title,
      date: document.getElementById('post-date').value || new Date().toISOString().split('T')[0],
      tags: document.getElementById('post-tags').value.split(',').map(function (t) { return t.trim(); }).filter(Boolean),
      markdown: markdown,
      excerpt: excerpt,
      readingTime: readingTime,
      isPrivate: isPrivate,
      isPublished: document.getElementById('post-published').checked,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    var savePromise;
    if (isPrivate && passwordVal) {
      savePromise = sha256(passwordVal).then(function (hash) {
        data.passwordHash = hash;
        return savePostData(data);
      });
    } else {
      savePromise = savePostData(data);
    }

    savePromise.then(function () {
      loadPosts();
      switchTab('posts');
    }).catch(function (e) { alert('Error saving: ' + e.message); });
  });

  function savePostData(data) {
    var id = editingPostId || document.getElementById('editing-post-id').value;
    if (id) {
      return db.collection('posts').doc(id).update(data);
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      return db.collection('posts').add(data);
    }
  }

  document.getElementById('cancel-edit-btn').addEventListener('click', function () {
    switchTab('posts');
  });

  // --- Live Preview ---
  var previewTimer;
  document.getElementById('post-markdown').addEventListener('input', function () {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(updatePreview, 300);
  });

  function updatePreview() {
    var md = document.getElementById('post-markdown').value;
    var el = document.getElementById('post-preview');
    if (!md) { el.innerHTML = 'Preview will appear here...'; return; }
    if (window.marked) {
      el.innerHTML = marked.parse(md);
    } else {
      el.textContent = md;
    }
  }

  // --- Books CRUD ---
  function loadBooks() {
    db.collection('books').orderBy('order').get().then(function (snap) {
      var container = document.getElementById('books-list');
      container.innerHTML = '';
      snap.forEach(function (doc) {
        var b = doc.data();
        var div = document.createElement('div');
        div.className = 'book-item';
        div.innerHTML = '<input type="text" value="' + esc(b.title) + '" placeholder="Title" data-field="title">' +
          '<input type="text" value="' + esc(b.author) + '" placeholder="Author" data-field="author">' +
          '<input type="text" value="' + esc(b.note || '') + '" placeholder="Note" data-field="note">' +
          '<button class="btn btn-primary save-book" data-id="' + doc.id + '">Save</button>' +
          '<button class="btn btn-danger del-book" data-id="' + doc.id + '">&times;</button>';
        container.appendChild(div);
      });

      container.querySelectorAll('.save-book').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var row = btn.closest('.book-item');
          db.collection('books').doc(btn.dataset.id).update({
            title: row.querySelector('[data-field="title"]').value,
            author: row.querySelector('[data-field="author"]').value,
            note: row.querySelector('[data-field="note"]').value
          }).then(function () { btn.textContent = 'Saved!'; setTimeout(function () { btn.textContent = 'Save'; }, 1000); });
        });
      });
      container.querySelectorAll('.del-book').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (confirm('Remove this book?')) db.collection('books').doc(btn.dataset.id).delete().then(loadBooks);
        });
      });
    });
  }

  document.getElementById('add-book-btn').addEventListener('click', function () {
    db.collection('books').add({
      title: '',
      author: '',
      note: '',
      order: Date.now(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(loadBooks);
  });

  // --- Access Links ---
  function loadLinks() {
    db.collection('access_links').orderBy('createdAt', 'desc').get().then(function (snap) {
      var container = document.getElementById('links-list');
      container.innerHTML = '';
      snap.forEach(function (doc) {
        var l = doc.data();
        var div = document.createElement('div');
        div.className = 'link-row';
        var baseUrl = location.origin + '/blog/access.html?id=' + doc.id;
        var expired = l.currentViews >= l.maxViews;
        div.innerHTML = '<span class="link-url">' + esc(baseUrl) + '</span>' +
          '<span class="link-info">' + l.currentViews + '/' + l.maxViews + ' views' +
          (expired ? ' <span class="badge badge-private">expired</span>' : '') + '</span>' +
          '<button class="btn btn-secondary copy-link" data-url="' + esc(baseUrl) + '">Copy</button>' +
          '<button class="btn btn-danger revoke-link" data-id="' + doc.id + '">Revoke</button>';
        container.appendChild(div);
      });

      container.querySelectorAll('.copy-link').forEach(function (btn) {
        btn.addEventListener('click', function () {
          navigator.clipboard.writeText(btn.dataset.url).then(function () {
            btn.textContent = 'Copied!';
            setTimeout(function () { btn.textContent = 'Copy'; }, 1500);
          });
        });
      });
      container.querySelectorAll('.revoke-link').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (confirm('Revoke this link?')) db.collection('access_links').doc(btn.dataset.id).delete().then(loadLinks);
        });
      });
    });
  }

  document.getElementById('generate-link-btn').addEventListener('click', function () {
    var postId = document.getElementById('link-post-select').value;
    var maxViews = parseInt(document.getElementById('link-max-views').value) || 1;
    if (!postId) { alert('Select a post first'); return; }

    db.collection('access_links').add({
      postId: postId,
      maxViews: maxViews,
      currentViews: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(loadLinks);
  });

  // --- Helpers ---
  function switchTab(name) {
    document.querySelectorAll('.nav-tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.tab === name);
    });
    document.querySelectorAll('.tab-content').forEach(function (c) { c.style.display = 'none'; });
    document.getElementById('tab-' + name).style.display = 'block';
  }

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }
})();
