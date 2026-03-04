# 09. Reports and Settings

## Reports

### Operational Intel (`src/app/reports/page.tsx`)
This module surfaces highly aggregated arrays of data to identify business trends. 
- **Sales Graphs**: Charts mapping revenue week-over-week.
- **Cash Flow Analytics**: Splits total intake by Cash, eSewa, Fonepay, and pure Credit lines over diverse, configurable date ranges.
- **Liability Mapping**: Shows the aggregate growth or contraction of the Dhito and Chit loan books. 

### Export Readiness
To align with accounting practices, standard reporting grids can be exported (via print-to-PDF or future CSV capabilities) directly for external auditors.

## Settings & Security

### User Permissions (`src/app/settings/page.tsx`)
The settings module allows the `owner` to dictate access.
- **Role Scoping**: There are multiple tiers (Owner, Manager, Cashier). 
- **PIN Configuration**: Passwords are built around fast 4-digit PIN access to accelerate checkouts. Owners can rotate PINs globally.

### Hardware Integrations
- Configures local weighing scale connections (COM port binding) to extract weight metrics instantly into POS instead of manual typing.

### Encrypted Backups
The single most important function in the settings panel. Since the app is Local-First, the "Export Encrypted Backup" safely bundles the entire RxDB instance into an `AES-256` encrypted JSON package, enabling secure flash-drive or manual cloud storage backups. 
