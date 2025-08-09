"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PortableTextBlock, SanityDocument } from "next-sanity";
import Link from "next/link";
import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";
import {
  defineSchema,
  EditorProvider,
  PortableTextChild,
  PortableTextEditable,
  type PortableTextBlock as EditorPortableTextBlock,
} from "@portabletext/editor";
import { EventListenerPlugin } from "@portabletext/editor/plugins";
import { nanoid } from "nanoid";

interface PropertyFormProps {
  mode: "add" | "edit";
  initialData?: SanityDocument;
}

interface PortableTextSpanChild {
  _type: "span";
  _key?: string;
  text: string;
  marks: string[];
}

interface PortableTextObjectChild {
  _type: string;
  _key?: string;
  [key: string]: unknown;
}

type PortableTextChildUnion = PortableTextSpanChild | PortableTextObjectChild;

export default function PropertyForm({ mode, initialData }: PropertyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    location: initialData?.location || "",
    price: initialData?.price || "",
    description: (initialData?.description as PortableTextBlock[]) || [],
    image: initialData?.image || null,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const form = new FormData();
    form.append("image", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (res.ok) {
        setFormData((prev) => ({
          ...prev,
          image: {
            _type: "image",
            asset: {
              _type: "reference",
              _ref: data.asset._id,
            },
          },
        }));
      } else {
        console.error("Upload failed:", data.error);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint =
        mode === "edit" ? `/api/listings/${initialData?._id}` : "/api/listings";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
        }),
      });

      if (res.ok) {
        router.refresh();
        router.push("/");
      } else {
        console.error("Error submitting form");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const ensureKeys = (
    blocks: PortableTextBlock[]
  ): EditorPortableTextBlock[] => {
    if (!blocks || blocks.length === 0) {
      return [
        {
          _type: "block",
          _key: nanoid(),
          style: "normal",
          markDefs: [],
          children: [
            {
              _type: "span",
              _key: nanoid(),
              text: "",
              marks: [],
            },
          ],
        },
      ] as EditorPortableTextBlock[];
    }

    return blocks.map((block) => ({
      ...block,
      _key: block._key || nanoid(),
      _type: "block" as const,
      style: block.style || "normal",
      markDefs: block.markDefs || [],
      children: (block.children || []).map((child) => {
        const portableChild = child as PortableTextChildUnion;

        if (portableChild._type === "span") {
          const spanChild = portableChild as PortableTextSpanChild;
          return {
            ...spanChild,
            _key: spanChild._key || nanoid(),
            _type: "span" as const,
            text: spanChild.text || "",
            marks: spanChild.marks || [],
          };
        } else {
          const objectChild = portableChild as PortableTextObjectChild;
          return {
            ...objectChild,
            _key: objectChild._key || nanoid(),
          };
        }
      }),
    })) as EditorPortableTextBlock[];
  };

  const schemaDefinition = defineSchema({
    decorators: [{ name: "strong" }, { name: "em" }, { name: "underline" }],
    styles: [
      { name: "normal" },
      { name: "h1" },
      { name: "h2" },
      { name: "blockquote" },
    ],
    lists: [{ name: "bullet" }, { name: "number" }],
    annotations: [],
    blockObjects: [],
    inlineObjects: [],
  });

  const handleDescriptionChange = (value: EditorPortableTextBlock[]) => {
    setFormData((prev) => ({
      ...prev,
      description: value as PortableTextBlock[],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Property Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter property title"
          />
        </div>

        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Location *
          </label>
          <input
            type="text"
            id="location"
            name="location"
            required
            value={formData.location}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Jakarta, Bali, Surabaya"
          />
        </div>

        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Price (IDR) *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            required
            value={formData.price}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 2500000000"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="image"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Property Image
          </label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full"
          />
          {uploading && (
            <p className="text-sm text-gray-500 mt-1">Uploading image...</p>
          )}
          {formData.image && (
            <Image
              src={urlFor(formData.image).width(400).height(300).url()}
              alt="Uploaded Preview"
              className="mt-3 rounded shadow w-full max-w-xs"
              width={400}
              height={300}
            />
          )}
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description
          </label>
          <div className="border border-gray-300 rounded-md relative">
            <EditorProvider
              initialConfig={{
                schemaDefinition,
                initialValue: ensureKeys(formData.description),
              }}
            >
              <EventListenerPlugin
                on={(event) => {
                  if (event.type === "mutation") {
                    handleDescriptionChange(
                      event.value as EditorPortableTextBlock[]
                    );
                  }
                }}
              />
              <div className="portable-text-editor">
                <PortableTextEditable
                  placeholder="Enter property description"
                  style={{
                    minHeight: "150px",
                    padding: "12px",
                    border: "none",
                    outline: "none",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    position: "relative",
                  }}
                />
              </div>
            </EditorProvider>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <Link
          href="/"
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {loading
            ? mode === "edit"
              ? "Updating..."
              : "Creating..."
            : mode === "edit"
              ? "Update Property"
              : "Create Property"}
        </button>
      </div>
    </form>
  );
}
