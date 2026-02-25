# Walsong JwelFlow — Premier Jewelry ERP
**A Next-Generation, Local-First Management System for Sunchadi Pasals**

> **Created and Directed by Sangam Baral, Founder & CEO**

---

## Overview
Walsong JwelFlow is an ultra-premium, complete Enterprise Resource Planning (ERP) solution built from the ground up for modern jewelry shops. It combines luxurious aesthetics with robust, offline-capable architecture.

It handles Inventory Management, Point of Sale (POS), Dhito/Bandhaki (Pawn/Loan) workflows, Role-Based Staff Management, and real-time Analytics — all without requiring a persistent internet connection.

## Distribution & Deployment Strategies

Walsong JwelFlow is designed to be distributed to clients in two distinct ways, depending on their needs:

### 1. Desktop Application (Native `.exe`)
This is the **primary recommended way** to distribute JwelFlow to jewelry shop owners. It provides a secure, isolated environment where their business data is completely safe.

*   **How it works**: We use **Tauri** to package the Next.js web application into a native Windows executable.
*   **Data Security**: The RxDB local database is stored deep within the Windows `%APPDATA%` folder. This means even if the user clears their web browser cookies or history, their gigabytes of shop data, invoices, and inventory remain perfectly intact and completely offline.
*   **How to Build for Desktop**:
    Please refer to our dedicated guide at `docs/BUILD_GUIDE.md` for exact terminal commands to generate the `WalsongJwelFlow_Setup.exe` file.
*   **How to Distribute**: Simply copy the generated `_setup.exe` onto a Pen Drive and hand it to the shop owner. They double-click it, install it, and the app runs just like Microsoft Word or Excel.

### 2. Web Application (Cloud Hosted)
If a client wishes to access their shop dashboard from multiple devices (e.g., from home and the shop simultaneously), JwelFlow can be hosted as a traditional web application.

*   **How it works**: The Next.js application is deployed to a cloud provider like Vercel, AWS, or Netlify.
*   **Data Caveat**: Because it runs in a standard web browser (Chrome, Edge), the RxDB local database is stored in the browser's IndexedDB. **If the user clicks "Clear browsing data", their entire shop database will be permanently deleted.**
*   *(Future Road-map: A remote synchronization server can be built using RxDB Sync to continuously backup data to a cloud PostgreSQL database, mitigating browser storage risks).*
*   **How to Deploy for Web**:
    1. Push this repository to GitHub.
    2. Connect the repository to Vercel (or preferred host).
    3. The build command is `npm run build` and the output directory is `.next`.

---

## Technical Stack
*   **Frontend Ecosystem**: Next.js 15 (React 19), Tailwind CSS, Framer Motion, customized Radix UI (`shadcn/ui`).
*   **Database**: RxDB (Reactive Database) for offline-first, local hydration.
*   **Packaging**: Tauri (Rust-based webview wrapper for Windows).
*   **Theming**: Dynamic CSS custom property injection based on an Emerald/Luxury design system.

## Project Structure
*   `/src/app`: Next.js App Router pages (Dashboard, POS, Inventory, Settings, etc.)
*   `/src/components`: Reusable UI modules, including global shells and interactive modals.
*   `/src/lib`: Core logic. `db/` contains RxDB schemas and setup. `auth-context.tsx` and `shop-context.tsx` manage global state.
*   `/src-tauri`: The Rust backend and configuration required to compile the Windows `.exe`.
*   `/docs`: Detailed guides, including the `BUILD_GUIDE.md` and `USER_MANUAL.md`.

---
*Developed with precision for the modern jewelry industry.*
**© 2026 Walsong JwelFlow. Sangam Baral, Founder & CEO.**
