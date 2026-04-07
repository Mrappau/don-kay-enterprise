/* ========== POS System - Data Layer (localStorage Database) ========== */

const DB = {
  // ===== Get / Set helpers =====
  get(key) { try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; } },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },

  // ===== Initialize default data =====
  init() {
    if (!this.get('pos_initialized')) {
      this.set('pos_products', DEFAULT_PRODUCTS);
      this.set('pos_categories', DEFAULT_CATEGORIES);
      this.set('pos_customers', DEFAULT_CUSTOMERS);
      this.set('pos_sales', []);
      this.set('pos_sales_items', []);
      this.set('pos_inventory_log', []);
      this.set('pos_payments', []);
      this.set('pos_registered_users', DEFAULT_USERS);
      this.set('pos_settings', DEFAULT_SETTINGS);
      this.set('pos_initialized', true);
    }
  },

  // ===== Products =====
  getProducts() { return this.get('pos_products') || []; },
  saveProducts(p) { this.set('pos_products', p); },
  addProduct(p) { const all = this.getProducts(); p.id = Date.now(); all.push(p); this.saveProducts(all); return p; },
  updateProduct(id, data) { const all = this.getProducts().map(p => p.id === id ? { ...p, ...data } : p); this.saveProducts(all); },
  deleteProduct(id) { this.saveProducts(this.getProducts().filter(p => p.id !== id)); },

  // ===== Categories =====
  getCategories() { return this.get('pos_categories') || []; },

  // ===== Customers =====
  getCustomers() { return this.get('pos_customers') || []; },
  saveCustomers(c) { this.set('pos_customers', c); },
  addCustomer(c) { const all = this.getCustomers(); c.id = Date.now(); c.loyaltyPoints = 0; c.totalPurchases = 0; c.dateCreated = new Date().toLocaleDateString(); all.push(c); this.saveCustomers(all); return c; },
  updateCustomer(id, data) { const all = this.getCustomers().map(c => c.id === id ? { ...c, ...data } : c); this.saveCustomers(all); },
  deleteCustomer(id) { this.saveCustomers(this.getCustomers().filter(c => c.id !== id)); },

  // ===== Sales =====
  getSales() { return this.get('pos_sales') || []; },
  saveSales(s) { this.set('pos_sales', s); },
  addSale(sale) {
    const all = this.getSales();
    sale.id = Date.now();
    sale.date = new Date().toISOString();
    sale.receiptNo = 'RCP-' + String(all.length + 1).padStart(5, '0');
    all.push(sale);
    this.saveSales(all);
    // Update product stock
    const products = this.getProducts();
    sale.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) prod.quantity = Math.max(0, prod.quantity - item.quantity);
    });
    this.saveProducts(products);
    // Update customer if assigned
    if (sale.customerId) {
      const customers = this.getCustomers();
      const cust = customers.find(c => c.id === sale.customerId);
      if (cust) { cust.totalPurchases += sale.total; cust.loyaltyPoints += Math.floor(sale.total / 100); }
      this.saveCustomers(customers);
    }
    // Save payment record
    const payments = this.get('pos_payments') || [];
    payments.push({ id: Date.now(), saleId: sale.id, amount: sale.total, method: sale.paymentMethod, date: sale.date, status: 'Completed' });
    this.set('pos_payments', payments);
    return sale;
  },

  // ===== Users =====
  getUsers() { return this.get('pos_registered_users') || []; },
  saveUsers(u) { this.set('pos_registered_users', u); },
  addUser(u) { const all = this.getUsers(); u.id = Date.now(); u.dateCreated = new Date().toLocaleDateString(); u.status = 'Active'; all.push(u); this.saveUsers(all); return u; },

  // ===== Settings =====
  getSettings() { return this.get('pos_settings') || DEFAULT_SETTINGS; },
  saveSettings(s) { this.set('pos_settings', s); },

  // ===== Reports =====
  getDailySales(dateStr) {
    const sales = this.getSales();
    return sales.filter(s => new Date(s.date).toDateString() === new Date(dateStr).toDateString());
  },
  getTotalRevenue() { return this.getSales().reduce((sum, s) => sum + s.total, 0); },
  getTodaySales() { return this.getDailySales(new Date().toISOString()); },
};

// ===== Default Data =====
const DEFAULT_CATEGORIES = ['Beverages', 'Snacks', 'Electronics', 'Stationery', 'Personal Care', 'Food', 'Household'];

const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Coca Cola 500ml', category: 'Beverages', price: 150, quantity: 48, barcode: '5449000000996', emoji: '🥤' },
  { id: 2, name: 'Bread (Loaf)', category: 'Food', price: 350, quantity: 20, barcode: '1234567890123', emoji: '🍞' },
  { id: 3, name: 'Biscuit Pack', category: 'Snacks', price: 200, quantity: 60, barcode: '2345678901234', emoji: '🍪' },
  { id: 4, name: 'Bottled Water 1.5L', category: 'Beverages', price: 100, quantity: 100, barcode: '3456789012345', emoji: '💧' },
  { id: 5, name: 'Exercise Book', category: 'Stationery', price: 50, quantity: 200, barcode: '4567890123456', emoji: '📓' },
  { id: 6, name: 'Ballpoint Pen', category: 'Stationery', price: 20, quantity: 500, barcode: '5678901234567', emoji: '🖊️' },
  { id: 7, name: 'Phone Charger', category: 'Electronics', price: 1500, quantity: 15, barcode: '6789012345678', emoji: '🔌' },
  { id: 8, name: 'Earphones', category: 'Electronics', price: 800, quantity: 25, barcode: '7890123456789', emoji: '🎧' },
  { id: 9, name: 'Soap Bar', category: 'Personal Care', price: 120, quantity: 40, barcode: '8901234567890', emoji: '🧼' },
  { id: 10, name: 'Toothpaste', category: 'Personal Care', price: 250, quantity: 35, barcode: '9012345678901', emoji: '🪥' },
  { id: 11, name: 'Rice (1kg)', category: 'Food', price: 500, quantity: 30, barcode: '1122334455667', emoji: '🍚' },
  { id: 12, name: 'Instant Noodles', category: 'Food', price: 80, quantity: 80, barcode: '2233445566778', emoji: '🍜' },
  { id: 13, name: 'Milk (500ml)', category: 'Beverages', price: 200, quantity: 40, barcode: '3344556677889', emoji: '🥛' },
  { id: 14, name: 'USB Flash Drive', category: 'Electronics', price: 2000, quantity: 10, barcode: '4455667788990', emoji: '💾' },
  { id: 15, name: 'Detergent', category: 'Household', price: 450, quantity: 25, barcode: '5566778899001', emoji: '🧴' },
  { id: 16, name: 'Tissue Paper', category: 'Household', price: 300, quantity: 50, barcode: '6677889900112', emoji: '🧻' },
];

const DEFAULT_CUSTOMERS = [
  { id: 1, name: 'Kwame Asante', phone: '0241234567', email: 'kwame@example.com', loyaltyPoints: 120, totalPurchases: 12000, dateCreated: 'Jan 15, 2026' },
  { id: 2, name: 'Ama Serwaa', phone: '0551234567', email: 'ama@example.com', loyaltyPoints: 85, totalPurchases: 8500, dateCreated: 'Feb 1, 2026' },
  { id: 3, name: 'Kofi Mensah', phone: '0271234567', email: 'kofi@example.com', loyaltyPoints: 200, totalPurchases: 20000, dateCreated: 'Jan 5, 2026' },
];

const DEFAULT_USERS = [
  { id: 1, name: 'Admin', email: 'admin@pos.com', password: 'admin123', role: 'Administrator', status: 'Active', dateCreated: 'Jan 1, 2026' },
  { id: 2, name: 'Jane Manager', email: 'jane@pos.com', password: 'manager123', role: 'Manager', status: 'Active', dateCreated: 'Jan 10, 2026' },
  { id: 3, name: 'John Cashier', email: 'john@pos.com', password: 'cashier123', role: 'Cashier', status: 'Active', dateCreated: 'Feb 1, 2026' },
];

const DEFAULT_SETTINGS = {
  storeName: 'QuickMart POS',
  storeAddress: '123 Main Street, Accra',
  storePhone: '0301234567',
  taxName: 'VAT',
  taxRate: 15,
  currency: 'GHS',
  currencySymbol: '₵',
  lowStockThreshold: 10,
  receiptFooter: 'Thank you for shopping with us!',
  paystackPublicKey: 'pk_test_xxxxxxxxxxxxxxxxxxxxx',
};

// Initialize on load
DB.init();
