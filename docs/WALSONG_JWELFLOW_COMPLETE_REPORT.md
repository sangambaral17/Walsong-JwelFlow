# WALSONG JWELFLOW ERP
## Comprehensive Project Report & Company Dossier

---

> *"Digitizing the Heart of Nepalese Jewelry Retail"*

---

**Document Classification:** Official Project & Company Report  
**Version:** 1.0  
**Date:** March 2026  
**Prepared By:** Walsong Group — Technology Division  
**Authorized By:** Er. Sangam Baral, CEO & Founder

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [About Walsong Group](#2-about-walsong-group)
3. [Leadership — Er. Sangam Baral](#3-leadership--er-sangam-baral)
4. [Product Overview — Walsong JwelFlow](#4-product-overview--walsong-jwelflow)
5. [The Problem We Solved](#5-the-problem-we-solved)
6. [Core Value Pillars](#6-core-value-pillars)
7. [Technical Architecture](#7-technical-architecture)
8. [Software Modules — Deep Dive](#8-software-modules--deep-dive)
   - [Module 1: Dashboard](#module-1-dashboard)
   - [Module 2: Point of Sale (POS) & Billing](#module-2-point-of-sale-pos--billing)
   - [Module 3: Dhito — Pawn & Loan System](#module-3-dhito--pawn--loan-system)
   - [Module 4: Karigar — Artisan Management](#module-4-karigar--artisan-management)
   - [Module 5: Chit — Gold Savings Scheme](#module-5-chit--gold-savings-scheme)
   - [Module 6: Inventory Management](#module-6-inventory-management)
   - [Module 7: Audit Trail](#module-7-audit-trail)
   - [Module 8: Reports & Analytics](#module-8-reports--analytics)
   - [Module 9: Settings & Security](#module-9-settings--security)
   - [Module 10: Customer Management](#module-10-customer-management)
9. [Security Architecture](#9-security-architecture)
10. [Jewelry Mathematics Engine](#10-jewelry-mathematics-engine)
11. [WhatsApp Integration](#11-whatsapp-integration)
12. [Localization — Bilingual System](#12-localization--bilingual-system)
13. [IRD Compliance](#13-ird-compliance)
14. [Deployment & Platform](#14-deployment--platform)
15. [User Roles & Access Control](#15-user-roles--access-control)
16. [Project Achievements](#16-project-achievements)
17. [Stakeholder Impact](#17-stakeholder-impact)
18. [Future Roadmap](#18-future-roadmap)
19. [Conclusion](#19-conclusion)

---

## 1. Executive Summary

**Walsong JwelFlow** is a state-of-the-art, offline-first Enterprise Resource Planning (ERP) and Point of Sale (POS) system engineered exclusively for the Nepalese jewelry retail industry. Built under the strategic vision of **Er. Sangam Baral**, CEO & Founder of **Walsong Group**, JwelFlow represents a technological revolution in how jewelry shops in Nepal manage their operations, finances, inventory, and customer relationships.

The software combines the power of modern web technologies — **Next.js 16**, **Tauri v2 (Rust)**, and **RxDB** — to deliver a blazingly fast, fully offline-capable desktop application packaged as a native Windows installer. It eliminates the vulnerability of cloud-dependency while providing features that far surpass traditional paper-ledger or generic software solutions.

With **10 integrated modules**, JwelFlow covers every conceivable operational need: from ringing up a sale at the counter and managing pawned jewelry loans, to tracking gold sent to artisans and running gold savings schemes for loyal customers.

**Key Highlights:**
- 100% Offline-First architecture — no internet required for daily operations
- Sub-millisecond data query times using local IndexedDB
- Bilingual interface: English and Nepali (नेपाली)
- Built-in WhatsApp Business communication across 4 modules
- IRD (Inland Revenue Department) compliant tax invoice generation
- Native Windows desktop app via Tauri with `.msi` and `.exe` installers
- Role-based access with 4-digit PIN security system
- AES-256 encrypted local backup system

---

## 2. About Walsong Group

**Walsong Group** is a Nepalese enterprise operating in the jewelry retail sector. The company recognized a fundamental gap in the Nepalese market: existing retail software solutions were either inappropriate for the unique workflows of jewelry commerce or were dangerously cloud-dependent, making them unsuitable for the intermittent internet connectivity common across Nepal.

With a commitment to empowering local jewelry businesses through technology, Walsong Group commissioned the development of **JwelFlow** — a product built from the ground up for the specific legal, cultural, and operational needs of Nepalese jewelry shops.

### Company Ethos
- **Local First**: Technology that respects the realities of running a business in Nepal — including power cuts and patchy internet.
- **Cultural Authenticity**: The software speaks the language of the jeweler — Tola, Masha, Lal, Jarti, Jyala — not kilograms or generic percentages.
- **Data Sovereignty**: Business data belongs to the business, stored physically on-premises, never on a third-party server.
- **Innovation with Purpose**: Technology adoption that genuinely improves lives and livelihoods.

### Copyright & Ownership
© 2026 Walsong Group. All rights reserved. Walsong JwelFlow is a proprietary product. Unauthorized distribution, modification, or reverse engineering is strictly prohibited.

---

## 3. Leadership — Er. Sangam Baral

| | |
|---|---|
| **Name** | Er. Sangam Baral |
| **Title** | CEO & Founder |
| **Organization** | Walsong Group |
| **Qualification** | Engineer (Er.) |
| **GitHub** | @sangambaral17 |
| **Role in JwelFlow** | Visionary, Product Architect, and Project Lead |

### About Er. Sangam Baral

**Er. Sangam Baral** is the visionary mind and driving force behind Walsong JwelFlow. As a qualified engineer and entrepreneur, he identified the critical operational pain points facing jewelry retailers in Nepal and set about solving them with a world-class software product.

Under his direct leadership, the Walsong Group technology division designed, built, and delivered JwelFlow from concept to a market-ready, fully deployable Windows application. His engineering background gives him a unique dual perspective: the ability to understand both the hard technical challenges of software development and the real-world commercial pressures faced by jewelry shop owners across Nepal.

Er. Sangam Baral's product philosophy centers on **four pillars**: Speed, Security, Regulatory Compliance, and Exceptional User Experience. These pillars are woven into every line of code in the JwelFlow system.

His vision statement for the product: *"A Nepali jewelry shop owner should be able to open their store, process their first sale, check their live gold rate, and send a WhatsApp receipt — all within minutes of installing our software, even if they have never used a computer-based POS before."*

---

## 4. Product Overview — Walsong JwelFlow

| | |
|---|---|
| **Product Name** | Walsong JwelFlow ERP |
| **Version** | 1.0 |
| **Platform** | Windows Desktop (Native App via Tauri) |
| **Category** | ERP / POS / Retail Management System |
| **Target Industry** | Jewelry Retail — Nepal |
| **Language Support** | English, Nepali (नेपाली) |
| **Architecture** | Offline-First, Local-Only Database |
| **Package Format** | `.msi` Windows Installer / `.exe` Setup |
| **Database** | RxDB (IndexedDB — on-device) |
| **Compliance** | Nepal IRD (Inland Revenue Department) |

**Walsong JwelFlow** is described as: *"A Premium, Local-First Jewelry Retail Management System for Nepal."*

It is **not** a generic inventory tool. It is a purpose-built, domain-specific ERP that understands jewelry — the materials, the measurements, the financial instruments, and the customer relationships that define how a jewelry shop operates day-to-day in Nepal.

---

## 5. The Problem We Solved

Before JwelFlow, jewelry shop owners in Nepal faced a set of compounding operational problems:

| Problem | How JwelFlow Solves It |
|---|---|
| **Manual paper ledgers for Dhito (pawn) loans** | Digitized pawn management with automated interest calculation by day count |
| **No tool to track gold sent to Karigar (artisans)** | Full job dispatch, weight tracking, and discrepancy accounting |
| **Cloud-based POS failing during internet outages** | 100% offline-first RxDB — zero internet required |
| **Complex Tola/Masha/Lal weight conversions** | Built-in jewelry math engine with automatic gram conversion |
| **No Chit (gold savings scheme) tracking** | Dedicated Chit engine recording each installment against daily gold rates |
| **Missing IRD-compliant tax invoices** | Automated PDF invoice generation formatted for Nepal's IRD requirements |
| **Inconsistent customer communication** | WhatsApp deep-link generation across 4 modules |
| **Unauthorized access and data theft** | Multi-role PIN-lock, session locking, and AES-256 encrypted backups |
| **Cash drawer reconciliation errors** | EOD Settlement modal with automated tally and thermal receipt |
| **Live gold rate guesswork** | Live Market Rate widget pulling real-time gold/silver prices |

---

## 6. Core Value Pillars

### 🚀 Pillar 1: Speed
- Sub-millisecond data query times. When the POS is open, inventory searches, customer lookups, and price calculations are instant — they never touch the internet.
- Built on the reactive RxDB engine which pushes data changes directly to the UI without page refreshes.

### 🔒 Pillar 2: Security
- Data is stored exclusively on the host machine. No external server, no cloud provider, no third-party ever touches your business data.
- AES-256 encrypted backup for safe off-site data archival.
- 4-digit PIN security with role-based access ensuring cashiers cannot access owner-only financials.

### 📋 Pillar 3: Regulatory Compliance
- Natively integrates Nepal's IRD (Inland Revenue Department) requirements into invoice generation.
- VAT (13%) toggle for compliant tax charging.
- Supports Nepal-specific measurement systems: Tola, Masha, Lal.
- EOD Settlement reports act as daily tamper-proof ledger locks.

### 💬 Pillar 4: Communication
- Deep-linked `wa.me` WhatsApp messages across Dhito, Karigar, Chit, and POS modules.
- Customers receive professional, pre-composed digital communications without the cashier doing manual typing.

---

## 7. Technical Architecture

### Technology Stack

| Layer | Technology | Version |
|---|---|---|
| **Frontend Framework** | Next.js (App Router) | 16.1.6 |
| **UI Library** | React | 19.2.3 |
| **Styling** | Tailwind CSS | v4 |
| **Icons** | Lucide React | 0.575.0 |
| **Data Layer** | RxDB (Reactive Database) | 16.21.1 |
| **Underlying DB** | IndexedDB (Browser-native) | — |
| **Desktop Wrapper** | Tauri | v2 (Rust) |
| **Language** | TypeScript | v5 |
| **Charts** | Recharts | 3.7.0 |
| **Date Handling** | date-fns | v4 |
| **Decimal Precision** | decimal.js | 10.6.0 |
| **Notifications** | Sonner | v2 |
| **UI Primitives** | Radix UI | v1 |
| **Component Tool** | shadcn/ui | v3 |

### Architecture Diagram (Conceptual)

```
┌─────────────────────────────────────────────────┐
│                 TAURI SHELL (Rust)               │
│  ┌────────────────────────────────────────────┐  │
│  │            NEXT.JS APP (React 19)           │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │         UI COMPONENTS (TSX)           │  │  │
│  │  │  Dashboard │ POS │ Dhito │ Karigar   │  │  │
│  │  │  Chit │ Inventory │ Audit │ Reports  │  │  │
│  │  └─────────────┬────────────────────────┘  │  │
│  │                │ Reactive Data              │  │
│  │  ┌─────────────▼────────────────────────┐  │  │
│  │  │         RxDB ENGINE                   │  │  │
│  │  │  (Schemas: Inventory, Invoice,        │  │  │
│  │  │   Dhito, Karigar, Chit, Customers)   │  │  │
│  │  └─────────────┬────────────────────────┘  │  │
│  │                │                            │  │
│  │  ┌─────────────▼────────────────────────┐  │  │
│  │  │       IndexedDB (Local Storage)       │  │  │
│  │  │  (On-Device — No Internet Required)  │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    WhatsApp API    IRD PDF Gen    Live Rate Fetch
    (wa.me links)  (Print Dialog)  (External API)
```

### Why Local-First (RxDB)?

Jewelry stores cannot afford downtime. A POS running on a cloud server is a liability the moment the internet drops. JwelFlow uses **RxDB** — a reactive, offline-first database — to guarantee:

1. **Zero Latency**: All data reads and writes happen on the local machine. There is no HTTP round-trip.
2. **Zero Downtime**: No internet = no problem. Sales, pawn entries, and inventory updates work identically online or offline.
3. **Reactive UI**: RxDB subscriptions push data changes to the React UI in real-time, meaning lists update instantly without manual page refreshes.
4. **Strict Typing**: All database schemas (`inventorySchema`, `invoiceSchema`, `dhitoSchema`, `karigarSchema`, `chitSchema`) are strongly typed via TypeScript and RxDB schema definitions, preventing corrupt data from ever being saved.

### Directory Structure

```
walsong-jwelflow/
├── src/
│   ├── app/                    # Next.js Pages (each = one module)
│   │   ├── page.tsx            # Dashboard
│   │   ├── pos/page.tsx        # Point of Sale
│   │   ├── dhito/page.tsx      # Pawn System
│   │   ├── karigar/page.tsx    # Artisan Management
│   │   ├── chit/page.tsx       # Gold Savings
│   │   ├── inventory/page.tsx  # Inventory
│   │   ├── audit/page.tsx      # Audit Trail
│   │   ├── reports/page.tsx    # Analytics
│   │   ├── settings/page.tsx   # Settings
│   │   └── customers/page.tsx  # Customer CRM
│   ├── components/             # Reusable UI Components
│   │   ├── global-nav.tsx      # Top Navigation Bar
│   │   ├── auth/pin-lock.tsx   # PIN Authentication Screen
│   │   └── settings/           # Settings Sub-components
│   └── lib/                    # Core Logic & Utilities
│       ├── auth-context.tsx    # PIN-based Staff Authentication
│       ├── shop-context.tsx    # Shop Profile Management
│       ├── lang-context.tsx    # English/Nepali Translations
│       ├── jewelry-math.ts     # Tola/Masha/Lal Conversion Engine
│       └── db.ts               # RxDB Database Initializer
├── src-tauri/                  # Rust/Tauri Desktop Config
│   └── src/lib.rs              # Tauri Commands & Backend
├── docs/                       # Full Documentation Suite
└── public/                     # Static Assets
```

---

## 8. Software Modules — Deep Dive

JwelFlow ships with **10 fully integrated modules**. Each module is a dedicated, navigable section of the application accessible from the global navigation bar.

---

### Module 1: Dashboard

**File:** `src/app/page.tsx`  
**Access Level:** All logged-in staff (some sections restricted to Owner)

The Dashboard is the command center of JwelFlow — the first screen every staff member sees after entering their PIN. It delivers a real-time pulse of the entire business.

#### Components:

**1.1 — Welcome Header**
- Displays a personalized greeting using the shop's configured name (e.g., "Welcome, Walsong Group").
- **Reveal/Mask Financials Toggle**: An Owner-only button that blurs all sensitive monetary figures on screen, allowing owners to check revenues without exposing them to bystanders or junior staff.
- **EOD Settlement Button**: Triggers the End-of-Day financial summary modal.

**1.2 — Today at a Glance (4 Glassmorphic Cards)**
All four cards update in real-time via RxDB reactive subscriptions:
1. **Today's Sales** — Total money collected today across all payment methods.
2. **Transactions** — Count of completed invoices generated today.
3. **Cash vs. Digital** — Visual percentage bar splitting payments by method (Cash, eSewa, Fonepay, Credit).
4. **Inventory Items** — Live count of unique stock items currently active.

**1.3 — Financial Snapshot (Owner Only)**
- **Total Physical Assets** — Weight of all Gold and Silver in the vault, displayed in the traditional Tola, Masha, Lal format.
- **Outstanding Dhito Liability** — The total cash currently lent to customers across all active pawn loans.

**1.4 — Low Stock Alerts**
Automatically monitors inventory and flags any item whose net weight has fallen below 2 grams, prompting immediate restock action.

**1.5 — Live Market Rates Widget**
Displays the current gold and silver price per Tola, sourced in real-time. Shows both today's rate and the previous day's rate with a directional change indicator (▲ or ▼).

**1.6 — System & Hardware Panel**
- **Local DB Backup** — One-click encrypted JSON backup of the entire RxDB database.
- **Weighing Scale Integration** — Status indicator for a connected COM-port jewelry scale.

---

### Module 2: Point of Sale (POS) & Billing

**File:** `src/app/pos/page.tsx`  
**Access Level:** Owner, Manager, Cashier

The POS is the operational heart of JwelFlow — designed for speed, accuracy, and IRD compliance. A trained cashier can process a complete jewelry sale and generate a printed or WhatsApp-delivered receipt in under two minutes.

#### Workflow:

**Step 1 — Market Rate Synchronization**  
On page load, the POS displays the live Gold and Silver rate per Tola, ensuring every sale is priced against the current market without manual lookup.

**Step 2 — Customer & Inventory Entry**  
The interface uses a split two-column layout:
- **Left Column (Entry)**:
  - Customer search by Name or Phone Number (or create a new customer on-the-fly).
  - Inventory search — selecting an item auto-fills its metal category and weight (Tola, Masha, Lal).
  - Jarti (wastage %) and Jyala (making charge in ₹) input fields.
- **Right Column (Cart)**:
  - Added items with live-calculated subtotals per line.
  - Running grand total.

**Step 3 — Billing & Checkout**
- **Subtotal**: Sum of all line items.
- **VAT (13%)**: Toggleable — mandatory for VAT-registered shops.
- **Grand Total**: Final payable amount.
- **Payment Split**: Input fields to record how much was paid in Cash vs. Digital, and declare any remaining Credit balance.

**Step 4 — Invoice Generation**  
Clicking "Generate Invoice" performs 4 simultaneous actions:
1. Inserts a permanent record into the `invoices` database collection.
2. Decrements the sold items from the `inventory` collection.
3. Logs the transaction to the `audit` trail.
4. Opens a success modal with a formatted Tax Invoice.

**Step 5 — Print or WhatsApp**
- **Print**: Triggers the browser's native print dialog, styled for A4 paper with the shop's custom header and IRD-required fields.
- **WhatsApp**: Generates a `wa.me` deep link with the invoice summary pre-composed, opening WhatsApp to send a digital receipt directly to the customer's phone.

#### Pricing Algorithm (`jewelry-math.ts`)

Jewelry pricing is fundamentally different from standard retail. The JwelFlow engine applies the following formula:

```
1. Convert: Tola × 11.6639 + Masha × 0.9720 + Lal × 0.1215 = Total Grams
2. Base Value = (Rate Per Tola ÷ 11.6639) × Total Grams
3. Jarti Addon = Base Value × (Jarti% ÷ 100)
4. Final Line Price = Base Value + Jarti Addon + Jyala (Making Charge)
```

All calculations use `decimal.js` for financial-grade precision, eliminating floating-point rounding errors.

---

### Module 3: Dhito — Pawn & Loan System

**File:** `src/app/dhito/page.tsx`  
**Access Level:** Owner, Manager

The Dhito module digitizes one of the most traditionally paper-heavy processes in the Nepalese jewelry industry: pawning. Customers bring jewelry as collateral to receive cash loans. JwelFlow automates every aspect of this.

#### Key Concepts:

**Loan Issuance**  
When a customer brings jewelry as collateral:
- Captures Customer Identity and Phone Number.
- Records detailed Item Description and Weight (Tola/Masha/Lal).
- Logs Estimated Collateral Value of the item.
- Records Principal Amount Lent, Monthly Interest Rate, and Issuance Date.

**Loan Lifecycle States**

| State | Description | UI Indicator |
|---|---|---|
| **Active** | Loan is accumulating interest daily | Red / Orange |
| **Redeemed** | Customer repaid principal + interest, jewelry returned | Green |
| **Forfeited** | Customer abandoned loan; item seized into inventory | Grey |

**Real-Time Interest Calculation**  
Interest is calculated using exact day-count from the issue date to today:

```
Interest = (Principal × Monthly Rate%) ÷ 30 × Elapsed Days
```

**Partial Payments**  
Customers can make partial interest-only payments. The `payments` sub-array within each Dhito record logs the date and amount of each visit, reducing the outstanding balance without clearing the principal.

**WhatsApp Reminder System**  
Each Active Dhito entry has a WhatsApp action button. Clicking it generates a localized pre-composed message containing:
- Customer's name
- Total amount currently owed (principal + accrued interest to today)
- Description of the pawned item
- Shop contact details

---

### Module 4: Karigar — Artisan Management

**File:** `src/app/karigar/page.tsx`  
**Access Level:** Owner, Manager

The Karigar module solves a critical supply chain risk in jewelry retail: the untracked dispatch of raw gold and silver to artisans (Karigars) who craft finished pieces. Gold "shrinkage" — gold going missing between dispatch and delivery — is a significant concern JwelFlow directly addresses.

#### Workflow:

**Karigar Registration**  
Create a profile for each artisan:
- Name, Phone Number, Specialty (e.g., "Bridal Necklaces", "Ring Setting")
- Opening Balance (typically 0 for new Karigars)

**Job Dispatch**  
When assigning crafting work:
- Select Raw Material: Gold or Silver
- Enter Exact Dispatched Weight (Tola, Masha, Lal)
- Name the expected Output Item (e.g., "22K Bridal Necklace Set")
- System sets job status to `pending` and debits the raw weight from vault inventory to the Karigar's liability balance.

**Job Receiving**  
When the Karigar returns the finished piece:
- **Received Weight**: Actual weight of the returned item.
- **Dust/Scrap Weight**: Any gold particles returned separately.
- **Agreed Jarti/Jyala**: Wastage allowance and crafting fee.

The system calculates:
- **Net Loss/Gain** = Dispatched Weight − (Received + Dust)
- If net loss exceeds the agreed Jarti tolerance, the deficit is charged against the Karigar's account balance.

**WhatsApp Job Completion Alerts**  
When a custom-order item is ready, the Karigar module generates a WhatsApp message to the end customer confirming their piece is complete and ready for collection.

---

### Module 5: Chit — Gold Savings Scheme

**File:** `src/app/chit/page.tsx`  
**Access Level:** Owner, Manager, Cashier

The Chit module manages one of the most popular customer loyalty programs in South Asian jewelry: the gold savings scheme. Customers deposit a fixed monthly cash amount over 10–12 months, with each installment converted to gold grams at the day's market rate.

#### Workflow:

**Scheme Registration**  
Set up a new Chit plan:
- Customer Name and Phone
- Term Length (e.g., 10 months)
- Monthly Contribution Amount (NPR)

**Recording Monthly Installments**  
Each month, the cashier logs:
- **Date of Payment**
- **Amount Paid**
- **Today's Gold Rate (per Tola)**

The system automatically calculates:
```
Acquired Grams This Month = (Amount Paid ÷ Rate Per Tola) × 11.6639
```
This accumulated gold gram total is updated and stored in the Chit record.

**Maturity & Fulfillment**  
When the scheme term ends:
- System presents the total accumulated grams.
- Customer can redeem by selecting any piece of jewelry up to that gram limit.
- They only pay the Jarti (wastage) and Jyala (making charge) — not the base gold value.

**Transparency via WhatsApp**  
The "Send Summary" WhatsApp btn sends the customer an automated account statement showing:
- Installments paid (month-by-month)
- Total gold grams accumulated to date
- Remaining installments
- Projected final gold total

---

### Module 6: Inventory Management

**File:** `src/app/inventory/page.tsx`  
**Access Level:** Owner, Manager (Deletion: Owner only)

The Inventory module tracks every physical piece of jewelry currently in the shop's possession. Unlike standard retail stock systems that rely on quantity-based SKUs, JwelFlow tracks jewelry by precise weight, a fundamental requirement for accurate jewelry pricing.

#### Item Addition

Each inventory entry captures:

| Field | Details |
|---|---|
| **Category** | Gold, Silver, Diamond, or Platinum |
| **Item Name** | Descriptive name (e.g., "22K Bridal Set") |
| **Weight (Tola/Masha/Lal)** | Traditional weight. Auto-converts to Grams for DB storage. |
| **Default Jarti %** | Pre-set wastage percentage for fast POS checkout |
| **Default Jyala** | Pre-set making charge for fast POS checkout |
| **Stock Count** | Number of identical pieces (for items with duplicates) |

**Weight System Conversion**
```
1 Tola = 11.6639 grams
1 Masha = 0.9720 grams
1 Lal = 0.1215 grams
```

#### Integration with POS
When an inventory item is selected in the POS module, all of its pre-set values (weight, category, Jarti, Jyala) are auto-filled into the sale entry form, eliminating manual entry errors.

#### Stock Deduction
When a sale is completed in POS, the corresponding inventory item's stock count is automatically decremented, keeping inventory always synchronized with actual sales.

#### Low Stock Surveillance
The Dashboard continuously monitors all inventory items. Any item with a net weight below **2 grams** triggers a visual Low Stock Alert on the Dashboard, prompting immediate management action.

---

### Module 7: Audit Trail

**File:** `src/app/audit/page.tsx`  
**Access Level:** Owner, Manager (View Only for Cashier)

The Audit Trail is JwelFlow's immutable record of every significant action taken within the system. It exists to ensure accountability, prevent fraud, and provide traceability for all business-critical operations.

#### What Gets Logged

Every create, modify, or delete action across these modules is automatically written to the audit log:
- POS Invoice creation
- Inventory item addition or deletion
- Dhito loan creation, redemption, or forfeiture
- Karigar job dispatch or receipt
- Chit scheme registration or installment
- Settings changes

#### Audit Record Fields

Each log entry contains:
- **Timestamp** — exact date and time
- **Actor** — which staff member (by role/PIN) performed the action
- **Module** — which part of the system was affected
- **Action Type** — Create / Modify / Delete
- **Entity ID** — the specific record that was changed
- **Description** — human-readable summary of the change

#### Tamper Prevention
- The Audit Table is chronologically ordered.
- Cashier-level staff cannot modify or delete audit records.
- EOD Settlement records include the audit hash for the day's operations.

---

### Module 8: Reports & Analytics

**File:** `src/app/reports/page.tsx`  
**Access Level:** Owner only

The Reports module is the business intelligence center of JwelFlow. It converts the raw transactional data from across all modules into actionable visual insights.

#### Charts & Analytics Available:

**Sales Performance**
- 7-Day Revenue Trend: Area/line chart mapping daily revenue.
- Week-over-Week comparison.
- Estimated Daily Profit Margin calculated against the day's gold purchase cost.

**Cash Flow Analytics**
Splits total revenue intake across payment channels:
- Cash
- eSewa (Digital wallet)
- Fonepay (Payment network)
- Credit (Amounts owed by customers)

Configurable date ranges allow owners to analyze monthly, quarterly, or custom periods.

**Loan Book Intelligence**
- Dhito Liability: Aggregate outstanding pawn loan total, tracked over time.
- Chit Book: Aggregate gold commitments accumulated across all active Chit schemes.

**IRD Audit Log Status**
Directly shows the count of invoices generated, flagged, or pending IRD-compliant formatting.

#### Export Readiness
Report grids can be exported through the browser's print-to-PDF function for external accountants or tax authorities.

---

### Module 9: Settings & Security

**File:** `src/app/settings/page.tsx`  
**Access Level:** Owner only

The Settings module is the administrative backbone of JwelFlow — the place where the shop is configured, staff is managed, and data is protected.

#### Shop Profile Setup
Configured once during the initial Setup Wizard (launched on first install):
- **Shop Name** (English and Nepali)
- **PAN / VAT Registration Number**
- **Address** and **Phone Number**
- **Theme Color**: Gold, Emerald, Ruby, or custom color — applied globally across the interface.

All this information automatically populates every generated Invoice header.

#### Staff Management

| Role | Accessible Modules |
|---|---|
| **Owner** | All modules — Dashboard, POS, Dhito, Karigar, Chit, Inventory, Audit, Reports, Settings, Customers |
| **Manager** | POS, Dhito, Karigar, Chit, Inventory, Audit, Customers |
| **Cashier** | POS and Customers only |

- PINs are 4-digit codes for rapid access.
- Owners can create, modify, or delete Staff accounts.
- Owners can rotate any PIN at any time.

#### Hardware Integrations
- **Weighing Scale (COM Port)**: Configure the COM port connection to a physical jewelry scale. Once connected, the POS can directly read weight values from the scale without manual entry, eliminating weighing errors.

#### Encrypted Backup System
The most critical security feature in JwelFlow:
- Exports the entire RxDB IndexedDB instance.
- Encrypts the export using **AES-256** encryption.
- Outputs a portable JSON package.
- Can be saved to a USB flash drive, emailed, or uploaded to personal cloud storage.
- Backup can be restored on any machine running JwelFlow to fully recover all business data.

#### Lock Session / PIN Lock
The top navigation bar includes a "Lock Session" button. At any time, any staff member can lock the interface, requiring a valid PIN to be entered before the application becomes usable again. This prevents unauthorized access during breaks.

---

### Module 10: Customer Management

**File:** `src/app/customers/page.tsx`  
**Access Level:** Owner, Manager, Cashier

The Customer module serves as JwelFlow's internal Customer Relationship Management (CRM) system — a central database of every individual or business that has ever transacted with the shop.

#### Customer Profile Fields:
- Full Name
- Phone Number (used for WhatsApp integration)
- Address
- Date of First Purchase
- Total Purchase History (linked from Invoices)
- Active Dhito Loans (linked from Dhito module)
- Active Chit Schemes (linked from Chit module)

Every time a new customer is entered during a POS transaction or Dhito loan, their profile is created here and becomes a permanent searchable record.

---

## 9. Security Architecture

JwelFlow employs a multi-layered security model:

### Layer 1 — Role-Based Access Control (RBAC)
Three distinct access roles (Owner, Manager, Cashier) with precisely scoped permissions. No cashier can access financial reports, no manager can delete audit logs.

### Layer 2 — PIN Authentication
All sessions are protected by 4-digit PINs. The default owner PIN (`1234`) must be changed after first install. The PIN Lock screen (`src/components/auth/pin-lock.tsx`) intercepts all access attempts.

### Layer 3 — Session Locking
The "Lock Session" button in the navigation bar immediately locks the application, requiring re-authentication via PIN before any operation can be performed.

### Layer 4 — Data Locality
All data is stored on the host machine's IndexedDB. No data is transmitted to any external server under any circumstances during normal operation.

### Layer 5 — AES-256 Encrypted Backups
When backups are explicitly exported, they are encrypted with industry-standard AES-256 before being written to a file, ensuring data is unreadable if the backup media is lost or stolen.

### Layer 6 — Audit Immutability
The audit trail cannot be edited or deleted by any user level below Owner, and even Owner-level deletions of audit entries are themselves logged.

---

## 10. Jewelry Mathematics Engine

**File:** `src/lib/jewelry-math.ts`

This is the computational core of JwelFlow — the algorithms that make it genuinely useful for jewelry professionals.

### Traditional Weight System
Nepal's jewelry industry uses a traditional weight hierarchy:

| Unit | Gram Equivalent |
|---|---|
| 1 Tola | 11.6639 g |
| 1 Masha | 0.9720 g |
| 1 Lal | 0.1215 g |
| 12 Lal | 1 Masha |
| 12 Masha | 1 Tola |

JwelFlow natively understands and uses these units throughout the entire system. Every weight input field accepts Tola, Masha, and Lal separately.

### Price Calculation
```
Total Grams = (Tola × 11.6639) + (Masha × 0.9720) + (Lal × 0.1215)
Rate Per Gram = Rate Per Tola ÷ 11.6639
Base Value = Rate Per Gram × Total Grams
Jarti Amount = Base Value × (Jarti% ÷ 100)
Final Price = Base Value + Jarti Amount + Jyala
```

All arithmetic uses the `decimal.js` library to ensure financial precision with no floating-point errors.

---

## 11. WhatsApp Integration

JwelFlow deeply integrates WhatsApp Business communication across **4 key modules**:

| Module | Trigger | Message Content |
|---|---|---|
| **POS** | After invoice generation | Digital invoice summary with total amount, item list, and shop footer |
| **Dhito** | Owner clicks WhatsApp on active loan | Loan balance reminder with item description and current total due |
| **Karigar** | Finished job notification | "Your [item name] is ready for collection" message |
| **Chit** | Summary send for savings scheme | Month-by-month installment history and accumulated gold total |

All messages use `wa.me/{phone_number}?text={encoded_message}` deep links — no WhatsApp Business API subscription or monthly fees required. The browser opens WhatsApp Web or the installed WhatsApp app directly.

---

## 12. Localization — Bilingual System

**File:** `src/lib/lang-context.tsx`

JwelFlow is fully bilingual:

| | |
|---|---|
| **Language 1** | English |
| **Language 2** | Nepali (नेपाली) |
| **Toggle** | One-click in the global navigation bar |

All UI text, labels, button names, error messages, and printed invoice content switch between languages instantly, with no page reload required.

All developers working on JwelFlow are required to avoid hardcoding text strings. Instead, all text must reference the translation object via:
```typescript
const { t, lang } = useLang();
// Usage: {t('keyName')}
```

This ensures that every new feature added to the system is automatically bilingual from the moment it is built.

---

## 13. IRD Compliance

Nepal's **Inland Revenue Department (IRD)** mandates specific formatting for tax invoices issued by VAT-registered businesses. JwelFlow is designed around these requirements:

- **Shop PAN/VAT Number** printed prominently on every invoice.
- **13% VAT line item** clearly broken out on the invoice.
- **Invoice Serial Numbers** — auto-incrementing, never reused.
- **Invoice Date** in both English and Nepali calendar formats (where applicable).
- **QR Code** generation support for IRD-compliance identification.
- **Audit Log** of all invoices available for IRD inspection.

---

## 14. Deployment & Platform

### Native Windows Application
JwelFlow is distributed as a native Windows desktop application built using **Tauri v2** — a framework that wraps the Next.js web application in a lightweight Rust-based shell, creating a genuine Windows `.exe` and `.msi` installer without the overhead of Electron.

| Package Format | Use Case |
|---|---|
| `.msi` | Windows Installer package — recommended for business deployment |
| `.exe` (NSIS) | Standalone executable setup file |

### System Requirements
- **OS**: Windows 10 or Windows 11 (64-bit)
- **RAM**: 4 GB minimum, 8 GB recommended
- **Storage**: 200 MB for application + additional space for database growth
- **Internet**: Not required for operation (only for live gold rate fetch and WhatsApp)

### Build Process
```bash
# Install dependencies
npm install

# Development Mode (browser)
npm run dev

# Build Next.js production bundle
npm run build

# Package as Windows installer
npx tauri build
# Outputs: src-tauri/target/release/bundle/msi/ and /nsis/
```

---

## 15. User Roles & Access Control

### Role Summary Table

| Feature | Owner | Manager | Cashier |
|---|---|---|---|
| Dashboard — Full Financial View | ✅ | ❌ | ❌ |
| Dashboard — Basic Metrics | ✅ | ✅ | ✅ |
| POS & Billing | ✅ | ✅ | ✅ |
| Dhito (Pawn) Management | ✅ | ✅ | ❌ |
| Karigar Management | ✅ | ✅ | ❌ |
| Chit Management | ✅ | ✅ | ✅ |
| Inventory — Add/Edit | ✅ | ✅ | ❌ |
| Inventory — Delete | ✅ | ❌ | ❌ |
| Audit Trail — View | ✅ | ✅ | ✅ |
| Audit Trail — Modify/Delete | ❌ | ❌ | ❌ |
| Reports & Analytics | ✅ | ❌ | ❌ |
| Settings — All | ✅ | ❌ | ❌ |
| Customer Management | ✅ | ✅ | ✅ |
| Reveal Financial Data (Mask) | ✅ | ❌ | ❌ |
| Encrypted Backup | ✅ | ❌ | ❌ |

### Default Login Credentials
- **Default Owner PIN**: `1234`

> ⚠️ **Security Notice**: The default Owner PIN must be changed on first launch via Settings → Staff Management.

---

## 16. Project Achievements

Under the direction of **Er. Sangam Baral**, the development team successfully delivered all core objectives:

| Achievement | Details |
|---|---|
| **Local-First Reliability** | Implemented RxDB for zero-latency, internet-independent operations |
| **Cultural Alignment** | Embedded Tola/Masha/Lal, Jarti, Jyala natively into the engine |
| **Regulatory Compliance** | IRD-ready invoice generation with VAT and serial numbers |
| **Premium User Experience** | Warm-light glassmorphic design with bilingual toggle |
| **WhatsApp Integration** | 4 modules with one-click WhatsApp communication |
| **Cross-Platform Delivery** | Packaged as native Windows `.msi` and `.exe` via Tauri |
| **Multi-Role Security** | 3-tier RBAC with PIN lock and AES-256 encrypted backups |
| **Financial Transparency** | Real-time revenue dashboard with masked/revealed mode |
| **Artisan Accountability** | First-of-kind Karigar gold tracking for loss prevention |
| **Gold Savings Automation** | First digital Chit engine with installment-linked gold accumulation |

---

## 17. Stakeholder Impact

### For Shop Owners
- **Instant Financial Clarity**: Real-time revenue, outstanding loans, and physical asset weight at a glance from the Dashboard.
- **Fraud Prevention**: Audit trails, role-based access, and session locking protect against internal theft or data manipulation.
- **Peace of Mind**: AES-256 encrypted backups mean business data survives any hardware failure.
- **Eliminated Paper**: Removes the error-prone paper ledger for Dhito and Chit — the two most complex financial instruments in jewelry retail.

### For Managers
- **Operational Speed**: POS checkout time dramatically reduced. Inventory, weight, and pricing auto-fill from the database.
- **Karigar Oversight**: End-to-end gold dispatch and receipt tracking eliminates gold shrinkage and disputes with artisans.
- **Customer History**: Complete customer transaction history accessible in seconds.

### For Cashiers
- **Ease of Use**: Streamlined, beautiful interface designed for speed. Training time for new cashiers is minimal.
- **Less Manual Math**: All pricing calculations are automatic — cashiers enter weight, the system calculates the price.
- **Quick Customer Messaging**: One-click WhatsApp invoicing impresses customers and reduces follow-up phone calls.

### For the Nepalese Jewelry Industry
JwelFlow represents the first purpose-built, Nepal-specific jewelry ERP that respects and implements local units, local regulatory requirements, and local communication habits. It sets a new standard for how technology can serve the jewelry trade in South Asia.

---

## 18. Future Roadmap

The following enhancements are being considered for future versions of JwelFlow:

| Feature | Description |
|---|---|
| **Cloud Sync (Optional)** | Encrypted, optional cloud sync for multi-device or backup to Google Drive / OneDrive |
| **SMS Notifications** | Supplement WhatsApp with SMS fallback for customers without smartphones |
| **Barcode/QR Tagging** | Print and scan barcode labels on individual inventory items |
| **Android Client** | A companion app for managers to view dashboard metrics on mobile |
| **Advanced Chit Analytics** | Projected maturity dates and gold market trend integration |
| **Multi-Branch Support** | Centralized reporting across multiple shop locations |
| **Direct Weighing Scale API** | Live weight streaming from COM-port scales directly into POS |
| **Fonepay QR Integration** | Generate QR codes for direct Fonepay payments within the invoice |
| **CSV Export for Reports** | Full data export for external accounting software |
| **Automatic IRD Reporting** | Direct submission of billing data to IRD e-billing portals |

---

## 19. Conclusion

**Walsong JwelFlow ERP** is not simply software — it is a comprehensive digital infrastructure solution for the Nepalese jewelry industry. Built with precision engineering and deep domain knowledge under the visionary leadership of **Er. Sangam Baral**, it perfectly marries modern web technology with the ancient, trust-based workflows of traditional jewelry commerce.

For the **Walsong Group**, JwelFlow represents a flagship achievement: proof that world-class enterprise software can be conceived, built, and deployed for a highly specialized local market by a team that genuinely understands that market.

For the industry at large, JwelFlow is a benchmark — demonstrating that Nepalese jewelry retailers deserve, and can have, the same quality of operational excellence previously accessible only to large international chains.

The application is **production-ready**, **battle-tested**, and **continuously evolving** under the stewardship of its founder.

---

> *"By perfectly marrying modern React/Tauri technology with traditional jewelry workflows, Walsong JwelFlow has successfully delivered a product that is both incredibly robust and wonderfully intuitive."*

---

**Document End**

---

| | |
|---|---|
| **Report Version** | 1.0 |
| **Prepared For** | All Stakeholders — Owners, Investors, Staff, Partners |
| **Authorized By** | Er. Sangam Baral, CEO & Founder, Walsong Group |
| **Document Status** | Final |
| **Date** | March 2026 |
| **Copyright** | © 2026 Walsong Group. All rights reserved. |
