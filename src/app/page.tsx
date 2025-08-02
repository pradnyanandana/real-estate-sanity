import Link from "next/link";
import Image from "next/image";
import { type SanityDocument } from "next-sanity";
import { urlFor } from "@/sanity/lib/image";
import { client } from "@/sanity/client";
import DeletePropertyButton from "@/components/DeletePropertyButton";

const PROPERTIES_QUERY = `*[
  _type == "property"
  && isPublished == true
]|order(_createdAt desc)[0...12]{
  _id, 
  title, 
  slug, 
  location, 
  price, 
  image,
  description[0...2]
}`;

const options = { next: { revalidate: 0 } };

export default async function PropertiesPage() {
  const properties = await client.fetch<SanityDocument[]>(
    PROPERTIES_QUERY,
    {},
    options
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <main className="container mx-auto min-h-screen max-w-6xl p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Properties</h1>
          <p className="text-gray-600">
            Discover your perfect property in Indonesia
          </p>
        </div>
        <Link
          href="/properties/add"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Add New Property
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No properties available at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div
              key={property._id}
              className="group block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden relative"
            >
              <Link href={`/properties/${property.slug.current}`}>
                <div className="relative h-48 w-full">
                  {property.image ? (
                    <Image
                      src={urlFor(property.image).width(400).height(300).url()}
                      alt={property.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image available</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                    {property.title}
                  </h2>

                  <div className="flex items-center text-gray-600 mb-2">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm">{property.location}</span>
                  </div>

                  <div className="text-2xl font-bold text-green-600 mb-3">
                    {formatPrice(property.price)}
                  </div>

                  {property.description && property.description.length > 0 && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {property.description[0]?.children?.[0]?.text || ""}
                    </p>
                  )}
                </div>
              </Link>

              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Link
                  href={`/properties/edit/${property.slug.current}`}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full shadow-lg transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </Link>
                <DeletePropertyButton
                  propertyId={property._id}
                  propertyTitle={property.title}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
