# ⚡ QUEEN HASUKI MINI — Premium WhatsApp Bot Platform

<p align="center">
  <img src="https://files.catbox.moe/aeg27n.png" alt="Queen Hasuki Mini Logo" width="220" style="border-radius: 50%; box-shadow: 0 8px 30px rgba(124, 58, 237, 0.35);"/>
</p>

<p align="center">
  <a href="https://github.com/DINETHDEV/nova-X-mini-3.0.git"><img src="https://img.shields.io/github/stars/DINETHDEV/nova-X-mini-3.0?style=for-the-badge&color=7C3AED&logo=github" alt="Stars"/></a>
  <a href="https://github.com/DINETHDEV/nova-X-mini-3.0.git"><img src="https://img.shields.io/github/forks/DINETHDEV/nova-X-mini-3.0?style=for-the-badge&color=06B6D4&logo=git" alt="Forks"/></a>
  <img src="https://img.shields.io/badge/Node.js-v18+-green?style=for-the-badge&logo=node.js" alt="Node.js version"/>
  <img src="https://img.shields.io/badge/Platform-WhatsApp-25D366?style=for-the-badge&logo=whatsapp" alt="Platform"/>
</p>

---

## 🌟 Introduction

**Queen Hasuki Mini** (powered by the **NovaX Mini Engine**) is a high-performance, modular, and extremely feature-rich WhatsApp user bot. It comes integrated with a sleek, ultra-modern **Web Control Panel** allowing you to monitor logs, configure settings, and manage plugins in real-time.

Designed with **Sinhala 🇱🇰 and English 🇬🇧** localization out-of-the-box, it delivers high reliability, blazing-fast response speeds, and advanced media download capabilities.

---

## 🛠️ Features & Capabilities

### 🎛️ 1. Modern Web Control Panel
- **Dashboard**: Real-time stats (connected bots, plugins count, memory/uptime stats).
- **Interactive Plugin Manager**:
  - Bulk actions: **Enable All**, **Disable All**, and **Reload All** plugins with a single click.
  - Granular control: Toggle individual plugins, view errors, and monitor registered commands.
- **Terminal Logs**: Live terminal feed streamed directly to your browser via WebSockets.
- **Multi-Bot Management**: Setup and pair multiple WhatsApp instances using QR or Pairing Code.

### 📥 2. Premium Media Downloaders
- **Song Downloader (`.song`)**: Download high-quality YouTube audios directly as standard audio or documents.
- **TikTok Downloader (`.tiktok`)**: Seamlessly fetch videos (HD, SD, or Watermarked) and MP3 music directly.

### ⚙️ 3. Advanced Configurations
- Simulates real-time behaviors: Auto-Recording / Auto-Typing.
- **Anti-Call**: Automatically rejects incoming calls to avoid interruption.
- Customizable command prefixes, language preferences, status visibility, and automated welcome/goodbye messages.

---

## 🚀 Getting Started

### 📋 Prerequisites
- **Node.js** (v18 or higher recommended)
- **MongoDB Database**
- **Git**

### 💻 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DINETHDEV/nova-X-mini-3.0.git
   cd nova-X-mini-3.0
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and specify the following variables:
   ```env
   PORT=8000
   MONGO_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/your_db
   LANGUAGE=en
   PREFIX=.
   ```

4. **Start the application:**
   ```bash
   npm start
   ```

5. **Access the Web Dashboard:**
   Open your browser and navigate to `http://localhost:8000`.

---

## 📂 Project Structure

```
QUEEN-HASUKI-MINI/
├── database/         # MongoDB schemas and models
├── lib/              # Core functions (Interactive UI, languages, database helpers)
├── middleware/       # API rate limiters and auth systems
├── plugins/          # Modulized bot command files (song, tiktok, system, etc.)
├── public/           # Frontend Web Panel files (HTML, CSS, JS)
├── routes/           # Web API endpoints (admin routes, bot routes)
├── services/         # Baileys socket connection and session management
├── config.js         # Centralized system configurations
└── NovaX_Mini.js     # Command registration shim
```

---

## 🤝 Contributing

We welcome contributions! Feel free to open issues, submit pull requests, or request features in the repository. 

*Designed and Developed with ❤️ by **Zero Bug Zone** & **DarkSide Developers**.*
