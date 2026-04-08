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

// ==================== RECEIPT PRINTING ====================

function generateReceipt(sale) {
  const settings = DB.getSettings();
  const storeName = settings.storeName || 'My POS Store';
  const taxRate = parseFloat(settings.taxRate) || 0;
  const footerMsg = settings.receiptFooter || 'Thank you for your patronage!';

  const subtotal = sale.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const now = new Date(sale.date || Date.now());
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();

  let itemsHTML = sale.items.map(item => `
    <tr>
      <td style="text-align:left;padding:2px 0">${item.name}</td>
      <td style="text-align:center">${item.qty}</td>
      <td style="text-align:right">₦${(item.price).toLocaleString()}</td>
      <td style="text-align:right">₦${(item.price * item.qty).toLocaleString()}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family:'Courier New',monospace;width:300px;margin:auto;padding:20px;font-size:13px;color:#000">
      <div style="text-align:center;margin-bottom:10px">
        <h2 style="margin:0;font-size:18px">${storeName}</h2>
        <p style="margin:4px 0;font-size:11px">Receipt #${sale.id || Math.floor(Math.random()*90000+10000)}</p>
        <p style="margin:2px 0;font-size:11px">${dateStr} ${timeStr}</p>
        <p style="margin:2px 0;font-size:11px">Cashier: ${sale.cashier || 'N/A'}</p>
      </div>
      <hr style="border:none;border-top:1px dashed #000;margin:8px 0">
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead>
          <tr style="border-bottom:1px solid #000">
            <th style="text-align:left;padding:4px 0">Item</th>
            <th style="text-align:center">Qty</th>
            <th style="text-align:right">Price</th>
            <th style="text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHTML}</tbody>
      </table>
      <hr style="border:none;border-top:1px dashed #000;margin:8px 0">
      <div style="font-size:12px">
        <div style="display:flex;justify-content:space-between"><span>Subtotal:</span><span>₦${subtotal.toLocaleString()}</span></div>
        <div style="display:flex;justify-content:space-between"><span>Tax (${taxRate}%):</span><span>₦${taxAmount.toLocaleString()}</span></div>
        <hr style="border:none;border-top:1px solid #000;margin:6px 0">
        <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:14px"><span>TOTAL:</span><span>₦${total.toLocaleString()}</span></div>
        <div style="display:flex;justify-content:space-between;margin-top:4px"><span>Payment:</span><span>${sale.method || 'Cash'}</span></div>
      </div>
      <hr style="border:none;border-top:1px dashed #000;margin:10px 0">
      ${sale.customerName ? `<p style="text-align:center;font-size:11px;margin:4px 0">Customer: ${sale.customerName}</p>` : ''}
      <p style="text-align:center;font-size:11px;margin:8px 0">${footerMsg}</p>
      <p style="text-align:center;font-size:10px;margin:4px 0">*** Powered by POS System ***</p>
    </div>
  `;
}

function printReceipt(sale) {
  const receiptHTML = generateReceipt(sale);
  const win = window.open('', '_blank', 'width=350,height=600');
  win.document.write(`
    <html>
    <head><title>Receipt</title></head>
    <body style="margin:0;padding:0">${receiptHTML}
      <div style="text-align:center;margin:20px;display:block" class="no-print">
        <button onclick="window.print()" style="padding:8px 24px;font-size:14px;cursor:pointer;background:#2563eb;color:#fff;border:none;border-radius:6px;margin-right:8px">🖨️ Print</button>
        <button onclick="window.close()" style="padding:8px 24px;font-size:14px;cursor:pointer;background:#64748b;color:#fff;border:none;border-radius:6px">Close</button>
      </div>
      <style>@media print { .no-print { display:none!important } body { margin:0 } }</style>
    </body></html>
  `);
  win.document.close();
}
