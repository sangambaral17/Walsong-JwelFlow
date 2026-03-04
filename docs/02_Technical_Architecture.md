# 02. Technical Architecture

## Core Technologies
Walsong JwelFlow is engineered using a modern hybrid desktop stack to achieve near-native performance while leveraging web development velocity.

- **Framework**: Next.js 16.1 (App Router)
- **UI & Styling**: Tailwind CSS v3, React (v19) Server & Client Components, Lucide React (Icons)
- **Database**: RxDB (Reactive Database based on IndexedDB)
- **Packaging**: Tauri v2 (Rust backend generating MSI and NSIS installers for Windows)

## Why Local-First (RxDB)?
Jewelry stores often struggle with inconsistent internet connections but require absolutely 100% uptime to process sales and manage high-value assets securely. 
- **RxDB** allows the application to query data locally on the host machine instantly (0ms latency).
- There is **no external backend server**. `getDb()` initializes a local IndexedDB instance.
- Data structures are strictly typed using RxDB Schemas (e.g., `inventorySchema`, `invoiceSchema`, `dhitoSchema`), ensuring data integrity.

## Directory Structure
- `/src/app`: Next.js App Router pages. Each folder (`/pos`, `/dhito`, `/karigar`) corresponds to a unique module.
- `/src/components`: Reusable UI elements (`global-nav.tsx`, `pin-lock.tsx`) and domain-specific widgets.
- `/src/lib`: Core utility functions.
  - `auth-context.tsx`: Manages PIN-based Staff login.
  - `shop-context.tsx`: Manages the global shop profile (used for invoices and WhatsApp).
  - `lang-context.tsx`: Manages English/Nepali translations.
  - `jewelry-math.ts`: Crucial algorithms for converting Grams to Tola/Masha/Lal, and calculating Jarti (wastage) and Jyala (making charge).

## Development Guide
To run the project locally:
```bash
npm install
npm run dev
```

To build the Tauri Windows executable (`.msi` installer):
```bash
npm run build
npx tauri build
```
*(Note: Requires Rust and MSVC C++ Build Tools installed on the host machine).*

## Localization System
The app uses a custom translation context (`src/lib/lang-context.tsx`).
Instead of hardcoding strings, developers should use `const { t, lang } = useLang();` and wrap text in `{t('keyName')}` to ensure seamless Nepali toggling.
