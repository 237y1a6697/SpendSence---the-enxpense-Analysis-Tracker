# SpendSense - Expense Analysis Tracker

A modern, glassmorphism-styled expense tracking application built with React, Vite, and Framer Motion.

## Features

- **Dynamic Interface**: Premium dark mode UI with smooth animations.
- **Dashboard**: Visual budget tracking with donut charts and transaction lists.
- **Cloud Ready**: structured with a `CloudService` layer that simulates async operations, ready to be swapped with Firebase/Supabase.
- **Responsive**: Mobile-first design principles.

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Run Development Server**:
    ```bash
    npm run dev
    ```
3.  **Build for Production**:
    ```bash
    npm run build
    ```

## Project Structure

- `src/components/LandingPage.jsx`: The "BizForge" style landing page.
- `src/components/Dashboard.jsx`: The expense tracker interface.
- `src/CloudService.js`: Mock backend service. Edit this file to connect to a real database.

## connecting to Cloud (Firebase)

To use a real cloud backend:
1.  Set up a Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
2.  Install Firebase SDK: `npm install firebase`.
3.  Replace the contents of `src/CloudService.js` with Firebase logic (Firestore/Auth).
