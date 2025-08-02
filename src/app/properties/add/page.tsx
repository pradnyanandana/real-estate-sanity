"use client";

import Link from "next/link";
import PropertyForm from "@/components/PropertyForm";

export default function AddPropertyPage() {
  return (
    <main className="container mx-auto min-h-screen max-w-4xl p-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Back to Properties
          </Link>
        </div>
        <h1 className="text-4xl font-bold mb-2">Add New Property</h1>
        <p className="text-gray-600">
          Fill in the details to add a new property listing
        </p>
      </div>

      <PropertyForm mode="add" />
    </main>
  );
}
