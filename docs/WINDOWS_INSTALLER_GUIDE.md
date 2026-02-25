# JwelFlow — Windows Installer Guide (.exe / .msi)

Because JwelFlow already uses **Tauri v2** internally, you **do not need** to use Advanced Installer or bundle Node.js manually! Tauri natively generates a highly-optimized, standalone Windows Installer (`Setup.exe` or `.msi`) that creates desktop shortcuts and works entirely offline.

Follow these steps to generate the Windows Installer for your customers.

---

## 1. Prerequisites 📋
Ensure your development computer (the one building the app) has the following installed:
1. **Node.js** (v18+)
2. **Rust**: Required by Tauri. Install from [rustup.rs](https://rustup.rs/).
3. **C++ Build Tools**: Install "Desktop development with C++" workload via the [Visual Studio Build Tools installer](https://visualstudio.microsoft.com/visual-cpp-build-tools/).

---

## 2. Project Preparation 🛠️
1. Open up your terminal in the `Walsong-JwelFlow` project directory.
2. Install all npm dependencies if you haven't yet:
   ```bash
   npm install
   ```

---

## 3. Building the Installer 🏗️
To generate the production installer, run the following command. This command will first build the Next.js app (`npm run build`), and then the Rust compiler will bundle it into a native Windows application:

```bash
npm run tauri build
```
*(If the command complains about a missing script, run `npx tauri build` instead).*

---

## 4. Locating the Built Installer 🔎
Once the compilation finishes, your installer files will be located here:

📂 **`src-tauri/target/release/bundle/msi/`** 
*(Contains the `.msi` Windows Installer)*

📂 **`src-tauri/target/release/bundle/nsis/`**
*(Contains the `Setup.exe` Windows Installer)*

---

## 5. Sharing with Customers 🤝
You can now take the `.msi` or `Setup.exe` file, put it on a USB drive or Google Drive, and give it to the customer. 
- They double-click the file to install.
- It will automatically set up Start Menu and Desktop shortcuts.
- No browser or Node.js server needs to be running in the background!

*Note: For the weighing scale, Tauri will request serial port access natively just like Microsoft Edge/Chrome.*
