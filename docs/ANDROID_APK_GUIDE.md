# JwelFlow — Android APK Generation Guide

Since JwelFlow is built with Next.js (React), the cleanest approach to generating an Android `.apk` file is using **CapacitorJS**. Capacitor wraps your web app in a native Android WebView and gives you access to native APIs if needed.

Follow these steps on your development machine to build the APK.

---

## 1. Prerequisites 📱
Ensure your development computer has the following installed:
1. **Node.js**: (v18+)
2. **Android Studio**: Download from [developer.android.com/studio](https://developer.android.com/studio).
3. **Java SDK**: Android Studio will install this, but ensure it's in your system `PATH`.

---

## 2. Setting Up Capacitor in JwelFlow ⚙️
Open your terminal in the `Walsong-JwelFlow` project directory and run the following commands once to set up the Android project.

### Step 2.1: Install Capacitor CLI & Core
```bash
npm install @capacitor/core @capacitor/android
npm install @capacitor/cli --save-dev
```

### Step 2.2: Initialize Capacitor
```bash
npx cap init
```
- App name: `Walsong JwelFlow`
- App Package ID: `com.walsong.jwelflow` (or any ID you prefer)
- Web asset directory: `out`

### Step 2.3: Add Android Platform
Ensure you have built your Next.js app first (`npm run build`), which generates the `out` folder.
```bash
npx cap add android
```

---

## 3. Building the APK 🏗️
Whenever you make changes to the JwelFlow codebase and want to create a new APK, follow this workflow:

1. **Build the Next.js App**:
   ```bash
   npm run build
   ```
2. **Sync the Web Code to the Android Project**:
   ```bash
   npx cap sync android
   ```
3. **Open Android Studio to Generate the APK**:
   ```bash
   npx cap open android
   ```

### Step 3.1: Inside Android Studio
1. Wait for Android Studio to finish indexing and Gradle syncing (watch the bottom progress bar).
2. From the top menu, go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. Once completed, a popup will appear in the bottom right corner. Click **locate** to find your `.apk` file.

*Alternatively, to generate a signed release APK for the Google Play Store, select **Build** > **Generate Signed Bundle / APK...***

---

## 4. Distributing to Customers 📲
You can now share the `.apk` file (usually named `app-debug.apk` or `app-release.apk`) directly with your customers via Google Drive, WhatsApp, or an email link.
- Customers must enable **Install from Unknown Sources** in their Android settings to install the standalone APK.
- The app will run smoothly on Android tablets and phones as a native application.
