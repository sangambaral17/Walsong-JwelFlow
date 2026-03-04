# 05. Dhito (Pawn) System

## Overview
The Dhito module (`src/app/dhito/page.tsx`) digitizes exactly how traditional pawn shops in Nepal lend money against physical gold and silver assets. This has historically been a perilous, paper-bound process highly prone to calculation errors. JwelFlow completely automates it.

## Key Concepts

### Loan Issuance
A customer brings an item (e.g., a 2 Tola gold ring). The shop lends them cash (Principal) at an agreed Monthly Interest Rate (typically 2-3% in the local market, though configurable).

The system records:
- Customer Identity & Phone
- Detailed Item Description & Weight (Tola/Masha/Lal)
- Estimated Value of the Item (Collateral Value)
- Principal Amount Lent
- Interest Rate & Issuance Date

### The Lifecycle of a Dhito
A Dhito loan exists in one of three states:
1. **Active**: The loan is currently accumulating interest.
2. **Redeemed**: The customer returned, paid the Principal + accrued Interest, and retrieved their jewelry.
3. **Forfeited**: The customer abandoned the loan, and the shop has seized the collateral asset into their vault.

## Advanced Features

### Real-Time Interest Calculation
Unlike simple bank loans, Dhito interest is often calculated on exact day-counts. The application uses a reactive loop to calculate elapsed days from the `issue_date` to today, auto-computing the live interest owed. 

*Formula applied internally*: `Interest = (Principal * MonthlyRate% / 30 days) * Elapsed Days`.

### Partial Payments
The system allows customers to walk in and pay *only* the accumulated interest, effectively resetting their term without clearing the principal. The `payments` sub-array tracks the history of these partial deductions.

### WhatsApp Reminders
Shop owners can proactively recover capital. By clicking the "WhatsApp" icon in the Actions column of an Active Dhito item, the software injects the live Total Due and the Item Description into a localized `wa.me` message and opens it in the browser, providing one-click outreach to debtors.
