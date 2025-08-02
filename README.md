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

- **Frontend:** Next.js 15, React, Tailwind CSS
- **Backend:** Sanity CMS (Headless)
- **Image Uploads:** Sanity Assets API

---

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/pradnyanandana/real-estate-sanity.git
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

## 🧩 Sanity Studio Setup

### 1. Install Sanity CLI

```bash
npm install -g sanity
```

### 2. Create a New Sanity Project

```bash
sanity init
```

- **Project name**: property-platform  
- **Dataset**: production (default)  
- **Output path**: `sanity/`  
- **Template**: Clean project with schema

### 3. Add the `property` schema

Create a new file: `sanity/schemas/property.ts`

```ts
import {defineField, defineType} from 'sanity'

export const propertyType = defineType({
  name: 'property',
  title: 'Property',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{type: 'block'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'isPublished',
      title: 'Published?',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
```

Then update `sanity/schemas/index.ts`:

```ts
import property from './property'
export const schemaTypes = [property]
```

### 4. Start Sanity Studio

```bash
cd sanity
sanity dev
```

Studio will run at: [http://localhost:3333](http://localhost:3333)

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
├── sanity/                   # Sanity Studio & schema files
├── public/
├── styles/
└── .env.local                # Environment variables
```

---

## 📄 License

MIT License © 2025 Your Name