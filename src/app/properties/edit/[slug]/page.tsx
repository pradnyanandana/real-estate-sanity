import { notFound } from "next/navigation";
import { client } from "@/sanity/client";
import { SanityDocument } from "next-sanity";
import PropertyForm from "@/components/PropertyForm";
import Link from "next/link";

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

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function EditPropertyPage({ params }: Props) {
  const { slug } = await params;
  const property = await client.fetch<SanityDocument>(
    PROPERTY_QUERY,
    { slug },
    options
  );

  if (!property) return notFound();

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
        <h1 className="text-4xl font-bold mb-2">Edit Property</h1>
        <p className="text-gray-600">
          Edit the details to update property listing
        </p>
      </div>
      <PropertyForm mode="edit" initialData={property} />
    </main>
  );
}
