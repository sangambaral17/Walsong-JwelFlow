# 06. Karigar (Artisan) Management

## Overview
A critical risk vector in jewelry retail is the management of raw materials dispatched to internal or external artisans (Karigars) for crafting. The Karigar module (`src/app/karigar/page.tsx`) tracks every gram of gold and silver leaving the shop and monitors exactly what comes back.

## How it Works

### 1. Karigar Registration
Create a profile for the artisan including Name, Phone Number, Specialty, and their baseline Balance (usually 0).

### 2. Job Dispatch
When assigning work to a Karigar:
- Specify the Raw Material (Gold/Silver).
- Log the Exact Dispatched Weight (Tola, Masha, Lal).
- Specify the expected Output Item (e.g., "Bridal Necklace").

The system assigns a `pending` status to the job, and the raw material weight is debited from the vault and moved to the Karigar's liability balance.

### 3. Job Receiving
When the Karigar returns the finished item:
- **Received Weight**: Total weight of the physical piece returned.
- **Dust/Scrap Weight**: Small particles returned (if any).
- **Assigned Jarti/Jyala**: The agreed-upon wastage allowance and crafting fee.

The application calculates the **Net Loss/Gain**. If the received weight + dust is less than the dispatched weight, the missing value is accounted for against the Karigar's cash balance (or forgiven based on industry Jarti tolerances).

### 4. WhatsApp Job Alerts
A "Notify Customer" button exists on the job card. If an item was crafted specifically for a retail order, one click generates a pre-formatted message verifying the item is ready, sending it via WhatsApp immediately to the customer.
