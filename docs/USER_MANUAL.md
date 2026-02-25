# Walsong JwelFlow — User Manual

Welcome to **JwelFlow** by Walsong. This manual will guide you through the core workflows of managing your jewelry pasal.

---

## 1. Initial Setup Wizard 🛠️
Upon launching the application for the first time, you will be greeted by the **Setup Wizard**.
1. Enter your shop's **Identity**: Shop Name (in Nepali or English), PAN/VAT number, Address, and Phone.
2. Select your **Theme Color**: Choose an accent color (e.g., Gold, Emerald, Ruby) that matches your brand. You can also pick a custom color.
3. Click "Finish Setup". The application will restart and apply your branding globally.

## 2. Staff Login & Security 🔐
JwelFlow uses Role-Based Access Control to protect your data.
- **Default Owner PIN**: `1234`
- **Roles**: 
  - `owner`: Full access to Settings, Reports, and Inventory deletion.
  - `manager`: Access to POS, Dhito, Customers, and Inventory management.
  - `cashier`: Access limited strictly to POS and Customers.
- *How to switch users*: Click the "Lock View" button in the top right corner of any protected page.

## 3. Point of Sale (POS) & Billing 💰
The POS connects directly to your live inventory and current market rates.
1. Navigate to "POS" from the top menu.
2. Select a customer from the database (or add a new one on the fly).
3. Select inventory items from the dropdown. Prices automatically calculate based on the item's weight and the live market rate (e.g., 24K Gold or Silver).
4. Add any custom labor charges (Jyala) or loss (Jarti).
5. Click **Checkout**. This generates an invoice containing your shop's custom header and footer.

## 4. Dhito (Pawn / Loan) Module ⚖️
Manage incoming pawned items and outgoing loan cash.
1. Navigate to "Dhito".
2. Click **New Dhito Form**.
3. Select the customer and enter the item description.
4. Use the custom weight calculator to input Tola, Masha, and Lal. It will auto-convert to grams.
5. Enter the loan amount and interest rate.
6. The dashboard will show active loans in Red (Disbursed) and redeemed loans in Green (Collected).

## 5. End of Day (EOD) Settlement 🖨️
At closing time, generate an automatic tally of your drawer.
1. From the main dashboard, click the Calculator icon labeled **EOD Settlement**.
2. View your total cash sales, digital sales, and net Dhito cash flow.
3. Click **Settle & Print** to generate an 80mm-width receipt perfectly formatted for thermal printers. This receipt acts as your daily ledger lock.

## 6. Business Analytics 📈
*(Owner Access Only)*
1. Navigate to "Reports".
2. View beautiful line and area charts detailing your 7-Day Revenue Trend and Estimated Daily Profit Margin.
3. Verify your IRD Audit Log status directly from this dashboard.

---
*For support or custom feature requests, please contact Walsong Support. Founder: Sangam Baral.*
