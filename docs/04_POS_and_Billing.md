# 04. POS and Billing

## Overview
The Point of Sale (POS) module (`src/app/pos/page.tsx`) is the transactional heart of the ERP. It facilitates the rapid creation of tax-compliant jewelry invoices, handles complex weight mathematics, and outputs printable or digital receipts.

## How It Works

### Step 1: Market Rate Synchronization
When the POS page loads, it fetches the `live_rates` document from the local store. The cashier is visibly informed of the current Gold and Silver rate per Tola at the top of the interface. 

### Step 2: Customer & Inventory Entry
The UI is split into two columns:
- **Left Column**: 
  - The Cashier searches for a customer by Name or Phone (or enters a new one). 
  - They then search the Inventory. Selecting an item auto-fills its category and weight (Tola/Masha/Lal) into the entry form.
  - The Cashier specifies the *Jarti* (wastage %) and *Jyala* (making charge in ₹).
- **Right Column (Cart)**:
  - Items are added to the active cart. The system instantly calculates the subtotal for each item via `calculateFinalPrice()`.

### Step 3: Billing & Checkout
- **Subtotal**: Sum of all items.
- **VAT (13%)**: Optional or mandatory toggleable tax structure.
- **Grand Total**: The final amount owed.
- **Payment Split**: The user can declare how much was paid via Cash vs. Digital, and how much is on Credit (Balance Due).

### Step 4: Invoice Generation & WhatsApp
Upon clicking "Generate Invoice":
1. A permanent document is inserted into the `invoices` collection.
2. Stock is deducted from the `inventory` collection (via background updates).
3. A success modal appears showing the **Tax Invoice**.
4. The user can click **Print** (triggers the browser's PDF print dialog styled strictly for A4 billing) or **WhatsApp**, which opens a pre-composed `wa.me` link to instantly send the digital receipt to the customer's phone number.

## Deep Dive: Pricing Algorithm
Pricing in jewelry is unique. The formula used internally (`jewelry-math.ts`) is:
1. Base Tola/Masha/Lal converted strictly to total `Grams`.
2. Base Value = `(RatePerTola / 11.6639) * Grams`
3. Jarti Addon = `Base Value * (Jarti% / 100)`
4. Total Line Item = `Base Value + Jarti Addon + Jyala (Making Charge)`.
