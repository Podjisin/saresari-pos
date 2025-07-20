# 🧺 Saresari-POS

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Tauri](https://img.shields.io/badge/-Tauri-FFC131?logo=tauri&logoColor=white)](https://tauri.app/)
[![React](https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=white)](https://react.dev/)

[![Open Issues](https://img.shields.io/github/issues-raw/Podjisin/saresari-pos)](https://github.com/Podjisin/saresari-pos/issues)
[![Open PRs](https://img.shields.io/github/issues-pr/Podjisin/saresari-pos)](https://github.com/Podjisin/saresari-pos/pulls)

</div>

**Saresari-POS** is a desktop Point-of-Sale system designed for small sari-sari store businesses in the Philippines.
It’s a personal project made for my mother as she starts her own sari-sari store.

Built using [Tauri](https://tauri.app/), [React](https://react.dev/), and [Chakra UI](https://chakra-ui.com/) – Saresari-POS is fast, lightweight, and works offline.

## ✨ Features

🔹 ✅ **Inventory Tracking with Batch Support**

- Add products with categories and units
- Track each batch with expiration dates, cost price, and quantity
- Automatic low stock warning
- Expiring items easily monitored with indexed expiration dates

🔹 🔃 **Sales Recording**

- Records each sale with itemized details
- Calculates total, cash received, and change
- Tracks which batch was sold for better inventory accuracy

🔹 🔃 **Returns and Exchanges**

- Allows refund, exchange, or store credit
- Tracks reasons and items returned

🔹 ✅ **Inventory and Product History**

- View all changes made to inventory and product information
- Great for auditing and restocking decisions

🔹 🔃 **Settings Panel**

- Configure shop name, contact info, tax rate, themes, etc.
- Set barcode scanner support, backup frequency, and more

🔹 ✅ **Sample Data Included**

- Comes with realistic sample products, batches, and sales
- Helps test features right away

## 📦 Tech Stack

- ⚙️ **Tauri** – Lightweight Rust-powered desktop apps
- ⚛️ **React** – UI development
- 💄 **Chakra UI** – Simple and accessible component library
- 🗃️ **SQLite** – Local database (with `tauri-plugin-sql`)
- 🦀 **Rust Migrations** – Versioned schema management

## 🚀 Getting Started

### Requirements

- Node.js (LTS)
- Rust toolchain
- Tauri CLI (`cargo install tauri-cli`)

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/saresari-pos.git
cd saresari-pos

# Install dependencies
npm install

# Run in development
npm run tauri dev
```

---

## 🗃️ Database Schema Highlights

This app uses versioned migrations written in Rust.

**Tables:**

- `inventory_category`, `inventory_unit`, `products`
- `inventory_batches` – tracks stock per batch
- `sales`, `sale_items`
- `returns`, `return_items`
- `inventory_history`, `product_history`
- `settings` – stores app configuration

## 📝 Project Status

🔧 **Still in development.**
Currently focused on inventory and basic sales functions. More features like printing receipts, user accounts, and reports will be added soon. maybe.

## 💖 Why This Project?

This is for my mom.
She’s planning to open a sari-sari store, and I wanted to create a tool that is:

- Simple and clear for everyday use
- Fully offline (no need for internet)
- Fast and lightweight on old laptops
- Not overwhelming for users unfamiliar with technology

## 📜 License

This project is licensed under the MIT License.

## 📬 Contact

Have feedback or want to contribute?
Feel free to open an issue or reach out!

<img src="https://views-counter.vercel.app/badge?pageId=https%3A%2F%2Fgithub%2Ecom%2FPodjisin%2Fsaresari-pos&leftColor=c0c0c0&rightColor=0adb3f&type=total&label=Visitors&style=none" alt="Views Counter">
