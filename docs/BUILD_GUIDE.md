# Walsong JwelFlow — Desktop Build Guide

This document outlines the pipeline for packaging the Next.js web application into a native Windows executable (`.exe`) using **Tauri**.

## Prerequisites
To compile the standalone desktop app, the host Windows machine must have the following installed:
1. **Node.js** (v18+)
2. **Rust** (Install via rustup: `rustup-init.exe`)
3. **C++ Build Tools** (Visual Studio community with "Desktop development with C++" workload)

## Packaging Steps
1. **Open PowerShell as Administrator** in the root `Walsong-JwelFlow` directory.
2. **Run the Build Command**:
   ```bash
   npx tauri build
   ```
3. **What happens under the hood?**
   - Tauri will first trigger `npm run build`, which Next.js will use to export the entire React application into static HTML/JS/CSS files inside the `out/` directory (configured via `next.config.ts` using `output: "export"`).
   - Tauri's Rust backend will then compile those static assets into a native Webview2 wrapper.
4. **Locate the Installer**:
   Once finished, the final installer is located at:
   `src-tauri/target/release/bundle/nsis/WalsongJwelFlow_0.1.0_x64-setup.exe`

## Distribution
You can copy this generated `_setup.exe` file onto a Pen Drive and provide it to the customer. When they run it, it installs Walsong JwelFlow locally. All their shop data, including the RxDB encrypted local-first database, will be securely stored in the Windows `%APPDATA%` folder, safe from browser cookies being cleared.
