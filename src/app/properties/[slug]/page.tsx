import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { type SanityDocument } from "next-sanity";
import { type SanityImageSource } from "@sanity/image-url/lib/types/types";

import { client } from "@/sanity/client";
import { urlFor } from "@/sanity/lib/image";

const PROPERTY_QUERY = `*[
  _type == "property" 
  && slug.current == $slug 
  && isPublished == true
][0]{
  _id,
  title,
  slug,
  location,
  price,
  image,
  description,
  _createdAt,
  _updatedAt
}`;

const options = { next: { revalidate: 0 } };

interface PropertyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { slug } = await params;
  const property = await client.fetch<SanityDocument>(
    PROPERTY_QUERY,
    { slug },
    options
  );

  if (!property) {
    notFound();
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <main className="container mx-auto min-h-screen max-w-4xl p-8">
      <nav className="mb-8">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 transition-colors"
        >
          ← Back to Properties
        </Link>
      </nav>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{property.title}</h1>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center text-gray-600">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-lg">{property.location}</span>
          </div>

          <div className="text-3xl font-bold text-green-600">
            {formatPrice(property.price)}
          </div>
        </div>
      </div>

      <div className="mb-8">
        {property.image ? (
          <div className="relative h-96 w-full rounded-lg overflow-hidden shadow-lg">
            <Image
              src={urlFor(property.image as SanityImageSource)
                .width(800)
                .height(600)
                .url()}
              alt={property.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="h-96 w-full bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-lg">No image available</span>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Description</h2>
        <div className="prose prose-lg max-w-none">
          {property.description ? (
            <PortableText value={property.description} />
          ) : (
            <p className="text-gray-500">No description available.</p>
          )}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4">Property Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="font-medium text-gray-700">Location:</span>
            <span className="ml-2">{property.location}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Price:</span>
            <span className="ml-2 text-green-600 font-semibold">
              {formatPrice(property.price)}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Listed:</span>
            <span className="ml-2">{formatDate(property._createdAt)}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Updated:</span>
            <span className="ml-2">{formatDate(property._updatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">
          Interested in this property?
        </h3>
        <p className="text-gray-700 mb-4">
          Contact us for more information about &quot;{property.title}&quot; in{" "}
          {property.location}.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Contact Agent
          </button>
          <button className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors">
            Schedule Viewing
          </button>
        </div>
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: PropertyPageProps) {
  const { slug } = await params;
  const property = await client.fetch<SanityDocument>(
    PROPERTY_QUERY,
    { slug },
    options
  );

  if (!property) {
    return {
      title: "Property Not Found",
    };
  }

  return {
    title: `${property.title} - ${property.location}`,
    description: `Property in ${property.location} for ${new Intl.NumberFormat(
      "id-ID",
      {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }
    ).format(property.price)}`,
  };
}
