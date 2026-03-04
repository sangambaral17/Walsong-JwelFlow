# 08. Inventory and Audit

## Overview
The Inventory and Audit modules are designed sequentially. Inventory (`src/app/inventory/page.tsx`) handles the everyday creation, categorization, and deletion of physical stock items, while Audit (`src/app/audit/page.tsx`) provides immutability and retrospective tracking.

## Inventory Management
Unlike standard retail items (which use simple quantities/SKUs), jewelry uses fluid weight systems. Every item requires pinpoint precision.

### Item Addition
When logging new stock into the safe, users must define:
- **Category**: Gold, Silver, Diamond, or Platinum.
- **Tola, Masha, Lal**: The traditional weight measures. The system automatically performs a background calculation to determine pure `Grams` for backend database storage.
- **Jarti & Jyala Profile**: Pre-setting the default percentage loss (wastage) and making charges ensures the POS automatically calculates the correct price without manual guesswork during checkout.

### Low Stock Surveillance
The dashboard watches the absolute gram count of inventory fragments. Items weighing less than 2 grams trigger a visual alert for immediate reordering.

## The Audit Trail
The Audit module (`src/app/audit/page.tsx`) connects the physical store with the digital reality. It's built for Owners and Managers to ensure no unauthorized database modifications slipped through.

### Features
1. **Activity Logs**: Every create, delete, or modify action executed in POS, Dhito, or Inventory is indelibly logged.
2. **End of Day (EOD) Check**: A specific routine to verify the physical cash drawer and vault match the reported system totals. Variances are highlighted and require an overriding PIN. 

**Note**: To prevent tampering, the Audit Table logs operations chronologically and prevents standard "cashier" level staff from modifying or deleting existing records.
