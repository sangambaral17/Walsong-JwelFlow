# 01. Overview and Introduction

## Introduction
Welcome to **Walsong JwelFlow**, the premier ERP and POS solution crafted exclusively for jewelry retailers in Nepal. Spearheaded by **CEO & Founder Er. Sangam Baral** for the **Walsong Group**, this software aims to digitize and secure every aspect of jewelry shop management without sacrificing the reliability of offline, local execution.

## Audience Guide

### For Stakeholders and Owners
Walsong JwelFlow protects your business data. Unlike cloud-based solutions that rent your data back to you, JwelFlow stores everything exactly where you install it—on your shop's computer. It brings modern capabilities like multi-user pin-locked access, encrypted backups, deep WhatsApp customer engagement, and granular daily financial reporting, while remaining insulated from internet outages or server costs. 

### For Customers / Users (Cashiers, Managers, Karigars)
The interface is designed for speed, beauty, and ease of use. It features a premium "warm-light" theme, bilingual toggling between English and Nepali, and streamlined tables that make entering inventory or generating a bil (invoice) take under a minute. Automated WhatsApp integrations save you time copying numbers and typing repetitive reminder messages.

### For Developers (Coders)
JwelFlow is a cutting-edge **Next.js + Tauri** hybrid app. It uses **RxDB** for reactive, offline-first data storage, completely bypassing traditional REST APIs for 0ms latency interactions. See [02_Technical_Architecture.md](02_Technical_Architecture.md) for a deep dive into schemas, routing, and packaging.

## Core Value Pillars
1. **Speed**: Sub-millisecond data query times using local IndexedDB.
2. **Security**: Data never leaves the host machine unless explicitly exported via the encrypted Backup module.
3. **Compliance**: Structured directly around Nepal's IRD tax regulations and standard jewelry industry measurements (Tola, Masha, Lal, Jarti, Jyala).
4. **Communication**: Built-in `wa.me` deep links to keep customers instantly updated.

Explore the following module documents to understand each specific component of the Walsong JwelFlow ecosystem.
