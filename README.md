# Aivora — AI Expert Marketplace (Frontend Client)

Aivora is a premium, modern, glassmorphism-themed AI Expert Marketplace platform where clients can easily post their project requirements, match with elite AI experts, collaborate securely via a milestone-based escrow system, and release funds upon successful deliverable approvals.

This repository contains the client-side single-page application (SPA) built with **React**, **TypeScript**, **Vite**, and styled with custom **Vanilla CSS** for visual excellence and premium aesthetics.

---

## ✨ Primary Business Flows Supported

1. **Client Job Campaign Creation & AI-Assisted Wizard**: Clients can outline their initial requirements in plain text. The system leverages AI to draft robust, detailed specifications, suggest budgets, establish timelines, and map out milestones.
2. **AI Expert Recommendations & Matching**: Based on the published job specifications, the platform automatically recommends matching AI experts to the client.
3. **Interactive Bidding & Proposals**: Experts can browse open jobs, submit proposals, bid custom amounts, and suggest milestone-based delivery paths.
4. **Milestone Escrow Management**: Client locks milestone funds securely in escrow. Expert implements, deploys, and uploads verified work deliverables. Client reviews and releases payments safely.
5. **Double-sided Reviews & Feedback**: Mutual 5-star ratings and written feedback are exchanged between client and expert once the project is marked COMPLETED.
6. **Dispute Resolution Queue**: Administrative interface for viewing, reviewing, and arbitrating milestone standoffs.

---

## 🛠️ Technology Stack & Architecture

- **Bundler & Core**: Vite + React 18 (TypeScript)
- **Styling Design System**: Premium custom CSS variables utilizing a curated HSL palette, dark modes, blur backdrops, glassmorphism panel styles, and smooth hover micro-animations.
- **Iconography**: Lucide React
- **API Communication**: Axios (pre-configured with local credentials, standard interceptors, and a local proxy to `http://localhost:5176/api`).

---

## 🚀 Getting Started

### 📋 Prerequisites
Ensure you have **Node.js** (v18 or higher) and **npm** installed.

### 📦 Installation
Clone the repository and install the development dependencies:
```bash
npm install
```

### 💻 Running Locally
To launch the development server with Hot Module Replacement (HMR) and real-time reloading:
```bash
npm run dev
```
By default, the application will boot and be accessible at: **`http://localhost:5173`**

### 🐳 API Configuration (Local proxy)
The application is pre-configured with a Vite proxy to communicate with the local C# ASP.NET Core Backend running at `http://localhost:5176`. Direct your backend endpoints to `/api` inside the client Axios configuration.

---

## 📁 Repository Structure

```text
Aivora-Frontend/
├── public/                 # Static assets (favicons, SVGs, etc.)
├── src/
│   ├── assets/             # Images and global icons
│   ├── components/         # Reusable layouts (PortalLayout, Navbar)
│   ├── context/            # AuthContext (persistent login states)
│   ├── pages/
│   │   ├── admin/          # Admin Dashboard & Dispute Arbitration
│   │   ├── client/         # Client Workspace (Job wizard, Wallet, Project view)
│   │   ├── expert/         # Expert Workspace (Bids list, Wallet, Workstation)
│   │   ├── ChatPage.tsx    # Live Chat interface
│   │   ├── LandingPage.tsx # Public Marketplace home screen
│   │   ├── LoginPage.tsx   # Login page
│   │   └── RegisterPage.tsx# Registration form
│   ├── services/           # API integrations (axios configuration)
│   ├── App.tsx             # Route declarations & main application wrapper
│   └── main.tsx            # Application entrypoint
├── package.json            # Scripts and dependencies declarations
└── vite.config.ts          # Proxy configurations and dev settings
```

---

## 📄 License
This project is licensed under the MIT License.
