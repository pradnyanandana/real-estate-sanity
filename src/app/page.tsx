import Link from "next/link";
import Image from "next/image";
import { PortableText, type SanityDocument } from "next-sanity";
import { urlFor } from "@/sanity/lib/image";
import { client } from "@/sanity/client";
import DeletePropertyButton from "@/components/DeletePropertyButton";

const PROPERTIES_PER_PAGE = 6;

const PROPERTIES_QUERY = `{
  "properties": *[
    _type == "property"
    && isPublished == true
  ]|order(_createdAt desc)[$start...$end]{
    _id, 
    title, 
    slug, 
    location, 
    price, 
    image,
    description[0...2]
  },
  "total": count(*[_type == "property" && isPublished == true])
}`;

const options = { next: { revalidate: 0 } };

interface PropertiesPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function PropertiesPage({
  searchParams,
}: PropertiesPageProps) {
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const start = (currentPage - 1) * PROPERTIES_PER_PAGE;
  const end = start + PROPERTIES_PER_PAGE;

  const { properties, total } = await client.fetch<{
    properties: SanityDocument[];
    total: number;
  }>(PROPERTIES_QUERY, { start, end }, options);

  const totalPages = Math.ceil(total / PROPERTIES_PER_PAGE);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Generate pagination numbers
  const getPaginationNumbers = () => {
    const delta = 2; // Show 2 pages before and after current page
    const range = [];
    const rangeWithDots = [];

    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    if (start > 1) {
      rangeWithDots.push(1);
      if (start > 2) {
        rangeWithDots.push("...");
      }
    }

    rangeWithDots.push(...range);

    if (end < totalPages) {
      if (end < totalPages - 1) {
        rangeWithDots.push("...");
      }

      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const paginationNumbers = getPaginationNumbers();

  return (
    <main className="container mx-auto min-h-screen max-w-6xl p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Properties</h1>
          <p className="text-gray-600">
            Discover your perfect property in Indonesia
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Showing {properties.length > 0 ? start + 1 : 0}-
            {Math.min(end, total)} of {total} properties
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
            {total === 0
              ? "No properties available at the moment."
              : "No properties found on this page."}
          </p>
          {total > 0 && currentPage > 1 && (
            <Link
              href="/properties"
              className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Go to First Page
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {properties.map((property) => (
              <div
                key={property._id}
                className="group block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden relative"
              >
                <Link href={`/properties/${property.slug.current}`}>
                  <div className="relative h-48 w-full">
                    {property.image ? (
                      <Image
                        src={urlFor(property.image)
                          .width(400)
                          .height(300)
                          .url()}
                        alt={property.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">
                          No image available
                        </span>
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

                    {property.description &&
                      property.description.length > 0 && (
                        <div className="text-gray-600 text-sm line-clamp-2">
                          <PortableText value={property.description} />
                        </div>
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

          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              {hasPrevPage ? (
                <Link
                  href={`/?page=${currentPage - 1}`}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200"
                >
                  Previous
                </Link>
              ) : (
                <span className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed">
                  Previous
                </span>
              )}

              {paginationNumbers.map((pageNum, index) => {
                if (pageNum === "...") {
                  return (
                    <span
                      key={`dots-${index}`}
                      className="px-3 py-2 text-sm font-medium text-gray-500"
                    >
                      ...
                    </span>
                  );
                }

                const isCurrentPage = pageNum === currentPage;
                return (
                  <Link
                    key={pageNum}
                    href={`/?page=${pageNum}`}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      isCurrentPage
                        ? "bg-blue-600 text-white border border-blue-600"
                        : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}

              {hasNextPage ? (
                <Link
                  href={`/?page=${currentPage + 1}`}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200"
                >
                  Next
                </Link>
              ) : (
                <span className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed">
                  Next
                </span>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
