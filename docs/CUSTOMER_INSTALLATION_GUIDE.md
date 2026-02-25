# Walsong JwelFlow — Customer Installation Guide

This guide describes the step-by-step process for installing **JwelFlow** on a customer's system. Follow these steps meticulously to ensure a smooth transition.

---

## 1. Prerequisites 📋
Ensure the following are installed on the customer's machine:
- **Node.js**: Version 18.x or higher.
- **Git**: For cloning the repository.
- **Web Browser**: Google Chrome or Microsoft Edge (required for Web Serial API).
- **Driver**: If using a weighing scale, ensure the appropriate RS232-to-USB drivers (like CH340 or CP210x) are installed.

---

## 2. Software Deployment 🛠️
1. **Clone the Project**:
   ```bash
   git clone https://github.com/Walsong/Walsong-JwelFlow.git
   cd Walsong-JwelFlow
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment**:
   - Create a `.env.local` file in the root directory.
   - Add necessary environment variables (e.g., `NEXT_PUBLIC_APP_URL`).
4. **Build the Application**:
   ```bash
   npm run build
   ```
5. **Start Production Server**:
   ```bash
   npm start
   ```

---

## 3. Hardware Integration (Weighing Scale) ⚖️
JwelFlow supports digital weighing scales via the Web Serial API.
1. **Connect the Scale**: Use an RS232 (DB9) to USB adapter.
2. **Port Configuration**:
   - Default Baud Rate: `9600`
   - Data Bits: `8`
   - Stop Bits: `1`
3. **Browser Permission**:
   - When the POS page is opened, click the **Connect Scale** button.
   - A browser popup will appear. Select the correct COM port (e.g., `USB-SERIAL CH340`) and click **Connect**.
4. **Verification**: Place an item on the scale. The weight should automatically populate in the POS item modal.

---

## 4. Initial Database & Branding 🎨
1. Open `http://localhost:3000` (or the configured URL).
2. The **Setup Wizard** will appear.
3. Fill in the Customer's Shop details (Name, PAN, Address).
4. Set the Owner PIN (Default is `1234`).
5. Choose the branding colors.
6. Click **Complete Setup**.

---

## 5. Troubleshooting 🔍
- **Scale doesn't connect**: Ensure no other software (like Serial Monitor) is using the COM port.
- **Web Serial not supported**: Use a modern version of Chrome or Edge. Brave may require "Serial API" to be enabled in `brave://flags`.
- **Database issues**: Clear LocalStorage or reset the IndexedDB if a clean start is required.

---
*For technical escalations, contact Sangam Baral (Walsong).*
