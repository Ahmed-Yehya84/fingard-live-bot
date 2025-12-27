# 🏦 FinGard AI | Умный Финансовый Помощник

<p align="center">
  <img src="https://img.shields.io/badge/Railway-0B0D11?style=for-the-badge&logo=railway&logoColor=white" />
  <img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google-gemini&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
</p>

---

## 🇬🇧 About the Project

**FinGard AI** is a professional-grade Telegram bot designed to bridge the gap between AI and personal finance. No more manual data entry—just talk to your bot or show it a receipt.

### 🚀 Key Features

- **🧠 AI Natural Language**: Log expenses like "Spent 15 on sushi and 4 on water" in one go.
- **👁️ Computer Vision**: Upload a photo of any receipt; the bot extracts the merchant name and total price automatically using **Gemini 1.5 Flash**.
- **📊 Instant Analytics**: Type `/stats` to generate a dynamic pie chart of your spending habits.
- **🔒 Secure Storage**: All data is managed via **Supabase (PostgreSQL)** with unique user-id isolation.
- **☁️ Always Online**: Fully deployed on **Railway** with automated CI/CD.

### 🛠️ Architecture

- **Language:** TypeScript
- **Framework:** grammY
- **Database:** Supabase (PostgreSQL)
- **AI Engine:** Google Gemini SDK
- **Visuals:** QuickChart API

---

## 🇷🇺 О проекте

**FinGard AI** — это высокотехнологичный Telegram-бот, объединяющий возможности искусственного интеллекта и управления личными финансами. Больше никакого ручного ввода — просто общайтесь с ботом или покажите ему чек.

### 🚀 Основные возможности

- **🧠 ИИ Обработка Текста**: Записывайте расходы фразами вроде «Потратил 15 на суши и 4 на воду» — бот поймет всё сразу.
- **👁️ Компьютерное зрение**: Загрузите фото любого чека; бот автоматически извлечет название магазина и итоговую сумму с помощью **Gemini 1.5 Flash**.
- **📊 Мгновенная аналитика**: Введите `/stats`, чтобы получить динамическую круговую диаграмму ваших трат.
- **🔒 Безопасное хранение**: Все данные управляются через **Supabase (PostgreSQL)** с изоляцией по ID пользователя.
- **☁️ Всегда в сети**: Полностью развернут на **Railway** с автоматическим CI/CD.

---

## ⚙️ Installation / Установка

```bash
# Clone the repository
git clone [https://github.com/Ahmed-Yehya84/fingard-live-bot.git](https://github.com/Ahmed-Yehya84/fingard-live-bot.git)

# Install dependencies
npm install

# Create .env file and add your keys
BOT_TOKEN=your_token
GEMINI_API_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key

# Run in development mode
npm start
```
