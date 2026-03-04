# 03. Dashboard

## Overview
The Dashboard (`src/app/page.tsx`) is the central hub and the first screen users see after passing the PIN lock. It serves as an executive summary of the shop's operational status.

## Key Components

### 1. The Welcome Header
Displays a personalized greeting pulling the active shop name from the `ShopProfile` (e.g., "Welcome, Walsong Group").
Includes essential quick actions:
- **Reveal/Mask Financials**: A toggle restricted to "Owner" roles that blurs out sensitive cash amounts so that other customers/staff cannot read the revenue metrics over the shoulder.
- **EOD Settlement**: Triggers the End of Day summary modal.

### 2. Today at a Glance
Four prominent glassmorphic cards display real-time reactive metrics (calculated directly via RxDB subscriptions):
1. **Today's Sales**: Total revenue generated today.
2. **Transactions**: Count of invoices finalized today.
3. **Cash vs Digital**: A visual percentage bar splitting today's payments by source.
4. **Inventory Items**: Total count of unique pieces currently in stock.

### 3. Financial Snapshot (Owner Only)
Provides profound insights into the capital locked within the business:
- **Total Physical Assets**: Total weight of Gold and Silver in the vault, natively formatted in Tola, Masha, and Lal.
- **Outstanding Dhito Liability**: The net cash amount currently lent out to customers against pawned jewelry. 

### 4. Low Stock Alerts
Automatically flags items whose net weight has fallen below 2 grams (often indicating parts, beads, or small items that need immediate restocking).

### 5. System Settings & Hardware
- **Local DB Backup**: 1-click encrypted JSON backup of the entire IndexedDB store.
- **Weighing Scale Integration**: Displays a "Ready" pulse indicating the system is prepared to read from COM-port integrated jewelry scales (future proofing).
