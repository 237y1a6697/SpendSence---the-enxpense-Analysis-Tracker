<img width="1908" height="875" alt="image" src="https://github.com/user-attachments/assets/72f585ed-c953-4168-8a9c-71c18bccaa43" /># 💸 SpendSense — Smart Expense Analysis Tracker

> A modern personal finance web app that helps users track, analyze, and understand their spending with interactive dashboards and AI-powered insights.

---

## 🚀 Live Demo

🔗 https://spend-sence-the-enxpense-analysis-t.vercel.app/

---

## 📌 Overview

**SpendSense** is a full-stack expense tracking and analysis platform built with a modern SaaS architecture. It allows users to manage their financial data, visualize spending patterns, and gain actionable insights to improve financial habits.

---

## ✨ Key Features

* 🔐 **Authentication**

  * Secure login/signup using **Firebase Auth**
  * Google OAuth integration

* 📊 **Interactive Dashboard**

  * Real-time expense tracking
  * Dynamic charts (category, trends, spending breakdown)

* 📁 **CSV Import**

  * Upload and parse transaction data using CSV files
  * Automatic column mapping and validation

* 💬 **AI Assistant**

  * Rule-based financial assistant
  * Answers queries about spending behavior

* 📅 **Budget Tracking**

  * Set monthly budgets
  * Visual indicators for spending limits

* 📄 **PDF Reports**

  * Export expense summaries as downloadable reports

* 🎨 **Modern UI**

  * Dark/Light theme toggle
  * Smooth animations with Framer Motion
  * Responsive design

---

## 🏗️ Tech Stack

### Frontend

* React 19 + Vite
* React Router v7
* TanStack React Query
* Recharts (data visualization)
* Framer Motion (animations)
* Lucide React (icons)

### Backend

* Node.js + Express.js

### Authentication & Database

* Firebase Authentication
* Firestore (cloud database)

### Utilities

* PapaParse (CSV parsing)
* html2canvas + jsPDF (PDF export)

---

## 📂 Project Structure

```
src/
├── components/
├── context/
├── services/
├── utils/
├── pages/
└── App.jsx

server/
└── index.js
```

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/237y1a6697/SpendSence---the-enxpense-Analysis-Tracker.git
cd SpendSence---the-enxpense-Analysis-Tracker
```

### 2. Install Dependencies

```bash
npm install
cd client && npm install
```

### 3. Setup Firebase

* Create a Firebase project
* Enable Authentication (Email/Password + Google)
* Enable Firestore Database
* Add your Firebase config in:

```
src/services/firebase.js
```

### 4. Run the App

```bash
npm run dev
```

---

## 🧠 How It Works

1. Users authenticate using Firebase
2. Transactions are stored in Firestore
3. Data is fetched and managed using React Query
4. Charts visualize spending patterns
5. AI assistant analyzes and responds to user queries

---

## 📊 Future Enhancements

* 🤖 AI-powered weekly spending insights
* 📉 Advanced analytics (monthly comparisons, trends)
* 🔔 Smart budget alerts (persistent)
* 🏦 Backend API with JWT authentication
* 📱 Mobile app version

---

## 🎯 Use Case

* Students managing daily expenses
* Individuals tracking monthly budgets
* Users analyzing spending habits

---

## 📸 Screenshots
<img width="1905" height="878" alt="image" src="https://github.com/user-attachments/assets/29ece58c-9985-490e-8d3c-9d2977e5cd4f" />
<img width="1913" height="867" alt="image" src="https://github.com/user-attachments/assets/402584dc-fa6a-4e99-b4a4-09647af92c96" />
<img width="1908" height="875" alt="image" src="https://github.com/user-attachments/assets/e23da12d-b49b-441d-8c4f-49de2f771cd9" />

*Add your screenshots here*

---

## 👨‍💻 Author

**Kavuri Prashanth Kumar**
📧 [237y1a6697@mlritm.ac.in](mailto:237y1a6697@mlritm.ac.in)
🔗 GitHub: https://github.com/237y1a6697

---

## ⭐ Show Your Support

If you like this project, consider giving it a ⭐ on GitHub!

---

## 📄 License

This project is for educational purposes.
