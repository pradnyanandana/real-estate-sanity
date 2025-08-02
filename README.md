# 🏡 Property Listing Platform

A full-stack application built with **Next.js**, **Sanity CMS**, and **Tailwind CSS** that allows users to create, view, and manage property listings.

---

## 🚀 Features

- Create, edit, and delete property listings
- Upload and preview images via Sanity Asset CDN
- Rich description and price input
- Fully styled with Tailwind CSS
- Responsive and accessible UI

---

## 🧱 Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS
- **Backend:** Sanity CMS (Headless)
- **Image Uploads:** Sanity Assets API

---

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/property-app.git
cd property-app
```

### 2. Install Dependencies

```bash
npm install
```

---

## 🔐 Environment Variables

Create a `.env.local` file in the root and add the following environment variables:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_WRITE_TOKEN=your_sanity_write_token
```

You can find these values in your Sanity project dashboard under **Settings → API**.

> 📝 To get `SANITY_API_WRITE_TOKEN`, go to Sanity Studio → API → Tokens → Generate a token with **Write access**.

---

## 📆 Start Development Server

```bash
npm run dev
```

App will be running at: [http://localhost:3000](http://localhost:3000)

---

## 📁 Folder Structure

```bash
.
├── pages/
│   ├── api/
│   │   └── upload.ts         # Image upload handler (to Sanity)
│   └── index.tsx             # Home page (listings)
├── components/
│   └── PropertyForm.tsx      # Form component for create/edit
├── sanity/                   # Sanity client config
├── public/
├── styles/
└── .env.local                # Environment variables
```

---

## 📄 License

MIT License © 2025 Your Name
