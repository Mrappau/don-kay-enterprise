# QuickMart POS System

A complete Point of Sale (POS) web application built with HTML, CSS, and JavaScript.

## Files
| File | Description |
|------|-------------|
| `index.html` | Login page |
| `signup.html` | User registration |
| `dashboard.html` | Admin dashboard with stats |
| `pos.html` | POS terminal (cart, checkout, Paystack) |
| `products.html` | Product management (CRUD) |
| `inventory.html` | Inventory tracking & restocking |
| `sales.html` | Sales history |
| `customers.html` | Customer management & loyalty |
| `reports.html` | Revenue reports & analytics |
| `users.html` | User management (Admin only) |
| `settings.html` | Store config, tax, Paystack keys |
| `style.css` | Global stylesheet |
| `data.js` | localStorage database layer |
| `app.js` | Shared logic (auth, sidebar, payments) |

## How to Run
1. Place all files in one folder
2. Open `index.html` in a browser
3. Login with: `admin@pos.com` / `admin123`

## Paystack Setup
1. Create account at https://paystack.com
2. Go to Settings → API Keys
3. Copy your **Public Key** (`pk_test_...`)
4. Paste in Settings → Paystack Integration

## Features
- Role-based access (Admin, Manager, Cashier)
- Product & inventory management
- POS terminal with cart
- Paystack online payment integration
- Receipt generation & printing
- Customer loyalty points
- Sales reports & analytics
- Data export/import (JSON backup)
