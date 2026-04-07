/* ========== POS System - Shared Application Logic ========== */

// ===== Auth =====
function checkAuth() {
  const user = JSON.parse(sessionStorage.getItem('pos_current_user'));
  if (!user) { window.location.href = 'index.html'; return null; }
  return user;
}

function logout() {
  sessionStorage.removeItem('pos_current_user');
  window.location.href = 'index.html';
}

function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem('pos_current_user'));
}

// ===== Toast =====
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) { container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span><button class="toast-close" onclick="this.parentElement.remove()">&times;</button>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ===== Format Currency =====
function formatCurrency(amount) {
  const settings = DB.getSettings();
  return `${settings.currencySymbol}${Number(amount).toFixed(2)}`;
}

// ===== Sidebar =====
function renderSidebar(activePage) {
  const user = getCurrentUser();
  const pages = [
    { label: 'Dashboard', icon: '📊', href: 'dashboard.html', key: 'dashboard' },
    { label: 'POS Terminal', icon: '🖥️', href: 'pos.html', key: 'pos' },
    { label: 'Products', icon: '📦', href: 'products.html', key: 'products' },
    { label: 'Inventory', icon: '📋', href: 'inventory.html', key: 'inventory' },
    { label: 'Sales', icon: '💰', href: 'sales.html', key: 'sales' },
    { label: 'Customers', icon: '👥', href: 'customers.html', key: 'customers' },
    { label: 'Reports', icon: '📈', href: 'reports.html', key: 'reports' },
  ];

  // Admin/Manager only pages
  if (user && (user.role === 'Administrator' || user.role === 'Manager')) {
    pages.push({ label: 'Users', icon: '🔑', href: 'users.html', key: 'users' });
  }
  pages.push({ label: 'Settings', icon: '⚙️', href: 'settings.html', key: 'settings' });

  const settings = DB.getSettings();
  const initial = user ? user.name.charAt(0).toUpperCase() : 'U';

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <h2>${settings.storeName}</h2>
        <small>Point of Sale System</small>
      </div>
      <nav class="sidebar-nav">
        ${pages.map(p => `<a href="${p.href}" class="${p.key === activePage ? 'active' : ''}"><span class="icon">${p.icon}</span>${p.label}</a>`).join('')}
      </nav>
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">${initial}</div>
          <div>
            <div class="user-name">${user ? user.name : 'Guest'}</div>
            <div class="user-role">${user ? user.role : ''}</div>
          </div>
        </div>
        <button class="btn btn-warning" style="width:100%" onclick="logout()">🚪 Logout</button>
      </div>
    </aside>
  `;
}

// ===== Top Bar =====
function renderTopBar(title, extraHtml = '') {
  return `
    <div class="top-bar">
      <div style="display:flex;align-items:center;gap:12px">
        <button class="btn btn-outline btn-sm" onclick="document.getElementById('sidebar').classList.toggle('open')" style="display:none" id="menuToggle">☰</button>
        <h1>${title}</h1>
      </div>
      <div class="top-bar-actions">${extraHtml}</div>
    </div>
  `;
}

// ===== Page Shell =====
function renderPageShell(activePage, title, contentHtml, topBarExtra = '') {
  document.body.innerHTML = `
    <div class="app-container">
      ${renderSidebar(activePage)}
      <div class="main-content">
        ${renderTopBar(title, topBarExtra)}
        <div class="page-content">${contentHtml}</div>
      </div>
    </div>
  `;
}

// ===== Modal helpers =====
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// ===== Paystack Payment =====
function payWithPaystack(email, amount, onSuccess, onClose) {
  const settings = DB.getSettings();
  const handler = PaystackPop.setup({
    key: settings.paystackPublicKey,
    email: email,
    amount: Math.round(amount * 100), // Paystack uses kobo/pesewas
    currency: settings.currency || 'GHS',
    callback: function(response) {
      showToast('Payment successful! Ref: ' + response.reference, 'success');
      if (onSuccess) onSuccess(response);
    },
    onClose: function() {
      showToast('Payment cancelled', 'info');
      if (onClose) onClose();
    }
  });
  handler.openIframe();
}

// ===== Utility =====
function generateId() { return Date.now() + Math.random().toString(36).substr(2, 5); }
function escapeHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
