# 07. Chit (Gold Savings)

## Overview
Chit (gold saving schemes) are highly popular in South Asian retail jewelry. Customers deposit fixed cash amounts monthly, locking in the prevailing gold rate on the day of deposit, allowing them to accumulate physical gold weight over 10-12 months.

The Chit Module (`src/app/chit/page.tsx`) converts this complex ledger-heavy process into an automated, transparent engine.

## The Chit Engine Workflow

### Registration
Initiate a new Chit plan for a customer:
- Set Customer Details (Name, Phone).
- Define Term Length (e.g., 10 Months).
- Set Monthly Contribution Amount (NPR).

### Recording Deposits
Each month, the cashier logs an installment:
- **Date of Payment**
- **Amount Paid**
- **Today's Gold Rate**

The system instantly calculates the *Acquired Gold Grams* based on the daily exchange rate and adds it to the customer's accrued total.

### Maturity & Fulfillment
Once the scheme reaches the final month, the application totals the accumulated grams. The customer can then pick any piece of jewelry weighing up to that specific gram limit without paying the base gold cost (they only pay standard Jarti and Jyala).

### Transparency and Communication
To foster trust, a **"Send Summary" WhatsApp button** is embedded on the Chit ledger view.
With one click, the cashier sends the customer an automated digital statement showing exactly how many installments have been paid and the total gold weight they have saved so far.
