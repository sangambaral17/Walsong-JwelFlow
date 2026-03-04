# Walsong JwelFlow ERP
**A Premium, Local-First Jewelry Retail Management System for Nepal**

Developed for **Walsong Group** under the leadership of **CEO & Founder Er. Sangam Baral**.

## Overview
Walsong JwelFlow is an advanced, offline-first Point of Sale (POS) and Enterprise Resource Planning (ERP) application specifically designed to meet the unique needs of the Nepalese jewelry industry. Built with Next.js, Tauri, and RxDB, it provides complete data sovereignty, real-time market rate synchronization, and automated IRD billing compliance.

## Key Features
- **10 Integrated Modules**: Dashboard, POS, Inventory, Dhito (Pawn), Karigar (Artisans), Chit (Gold Savings), Customers, Reports, Audit, and Settings.
- **Local-First Architecture**: Runs purely offline using RxDB (IndexedDB) with optional encrypted cloud backup. Ensures zero data loss even during internet outages.
- **Bilingual Interface**: Seamlessly toggles between English and Nepali (नेपाली) language modes.
- **WhatsApp Integration**: Deep-linked WhatsApp message generation for sending Dhito reminders, Karigar job completion notices, Chit maturity alerts, and POS invoice receipts directly to customers.
- **IRD Compliance Prepared**: Generates PDF invoices and QR codes formatted specifically for Nepal's Inland Revenue Department requirements.

## Documentation
Comprehensive documentation for all stakeholders is available in the `docs/` directory:
- [01. Overview and Introduction](docs/01_Overview_and_Introduction.md)
- [02. Technical Architecture](docs/02_Technical_Architecture.md)
- [03. Dashboard](docs/03_Dashboard.md)
- [04. POS and Billing](docs/04_POS_and_Billing.md)
- [05. Dhito (Pawn) System](docs/05_Dhito_Pawn_System.md)
- [06. Karigar Management](docs/06_Karigar_Management.md)
- [07. Chit Gold Savings](docs/07_Chit_Gold_Savings.md)
- [08. Inventory and Audit](docs/08_Inventory_and_Audit.md)
- [09. Reports and Settings](docs/09_Reports_and_Settings.md)
- [10. Final Project Report](docs/10_Final_Project_Report.md)

## Tech Stack
- **Frontend**: Next.js 16 (React 19), Tailwind CSS, Lucide Icons
- **Desktop Wrapper**: Tauri 2.0 (Rust-based)
- **Database**: RxDB (Offline-first synced IndexedDB)

---
© 2026 Walsong Group. All rights reserved.
