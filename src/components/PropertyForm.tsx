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
  PortableTextEditable,
  useEditor,
  type PortableTextBlock as EditorPortableTextBlock,
  type RenderDecoratorFunction,
  type RenderStyleFunction,
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

  // Enhanced schema with more rich text options
  const schemaDefinition = defineSchema({
    decorators: [
      { name: "strong", title: "Bold" },
      { name: "em", title: "Italic" },
      { name: "underline", title: "Underline" },
      { name: "strike-through", title: "Strike Through" },
      { name: "code", title: "Code" },
    ],
    styles: [
      { name: "normal", title: "Normal" },
      { name: "h1", title: "Heading 1" },
      { name: "h2", title: "Heading 2" },
      { name: "h3", title: "Heading 3" },
      { name: "h4", title: "Heading 4" },
      { name: "blockquote", title: "Quote" },
    ],
    lists: [
      { name: "bullet", title: "Bullet List" },
      { name: "number", title: "Numbered List" },
    ],
    annotations: [
      {
        name: "link",
        title: "Link",
        type: "object",
        fields: [
          {
            name: "href",
            type: "string",
            title: "URL",
          },
        ],
      },
    ],
    blockObjects: [],
    inlineObjects: [],
  });

  const handleDescriptionChange = (value: EditorPortableTextBlock[]) => {
    setFormData((prev) => ({
      ...prev,
      description: value as PortableTextBlock[],
    }));
  };

  // Render functions to display formatting in the editor
  const renderDecorator: RenderDecoratorFunction = (props) => {
    if (props.value === "strong") {
      return <strong>{props.children}</strong>;
    }
    if (props.value === "em") {
      return <em>{props.children}</em>;
    }
    if (props.value === "underline") {
      return <u>{props.children}</u>;
    }
    if (props.value === "strike-through") {
      return <s>{props.children}</s>;
    }
    if (props.value === "code") {
      return (
        <code className="bg-gray-100 px-1 rounded text-sm">
          {props.children}
        </code>
      );
    }
    return <>{props.children}</>;
  };

  const renderStyle: RenderStyleFunction = (props) => {
    if (props.schemaType.value === "h1") {
      return <h1 className="text-2xl font-bold">{props.children}</h1>;
    }
    if (props.schemaType.value === "h2") {
      return <h2 className="text-xl font-bold">{props.children}</h2>;
    }
    if (props.schemaType.value === "h3") {
      return <h3 className="text-lg font-bold">{props.children}</h3>;
    }
    if (props.schemaType.value === "h4") {
      return <h4 className="text-base font-bold">{props.children}</h4>;
    }
    if (props.schemaType.value === "blockquote") {
      return (
        <blockquote className="border-l-4 border-gray-300 pl-4 italic">
          {props.children}
        </blockquote>
      );
    }
    return <>{props.children}</>;
  };

  // Toolbar component for rich text formatting that uses current PortableText editor API
  const RichTextToolbar = () => {
    const editor = useEditor();

    const toggleDecorator = (decorator: string) => {
      editor.send({
        type: "decorator.toggle",
        decorator: decorator,
      });
      editor.send({ type: "focus" });
    };

    // Note: In the current API, we can't easily check if a decorator is active
    // You might need to track this state separately or use editor selection info

    return (
      <div className="border-b border-gray-200 p-3 bg-gray-50">
        <div className="flex flex-wrap items-center gap-2">
          {/* Text Style Buttons */}
          <div className="flex items-center border-r border-gray-300 pr-2 mr-2">
            <button
              type="button"
              className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title="Bold (Ctrl+B)"
              onClick={() => toggleDecorator("strong")}
            >
              <svg
                width="16px"
                height="16px"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
              >
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M4 1a1 1 0 00-1 1v16a1 1 0 001 1v-1 1h8a5 5 0 001.745-9.687A5 5 0 0010 1H4zm6 8a3 3 0 100-6H5v6h5zm-5 2v6h7a3 3 0 100-6H5z"
                />
              </svg>
            </button>
            <button
              type="button"
              className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title="Italic (Ctrl+I)"
              onClick={() => toggleDecorator("em")}
            >
              <svg
                width="22px"
                height="22px"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g id="Edit / Italic">
                  <path
                    id="Vector"
                    d="M8 19H10M10 19H12M10 19L14 5M12 5H14M14 5H16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              </svg>
            </button>
            <button
              type="button"
              className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title="Underline (Ctrl+U)"
              onClick={() => toggleDecorator("underline")}
            >
              <svg
                width="22px"
                height="22px"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 4V11C7 13.7614 9.23858 16 12 16C14.7614 16 17 13.7614 17 11V4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M5 20H19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className="flex items-center border-r border-gray-300 pr-2 mr-2">
            <button
              type="button"
              className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title="Strike Through"
              onClick={() => toggleDecorator("strike-through")}
            >
              <svg
                width="22px"
                height="22px"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
              >
                <path
                  stroke="#000000"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 5h-7a3 3 0 0 0-3 3v1a3 3 0 0 0 3 3h7M7 19h7a3 3 0 0 0 3-3v-1M5 12h14"
                />
              </svg>
            </button>
            <button
              type="button"
              className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title="Code"
              onClick={() => toggleDecorator("code")}
            >
              <svg
                width="22px"
                height="22px"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14.1809 4.2755C14.581 4.3827 14.8185 4.79396 14.7113 5.19406L10.7377 20.0238C10.6304 20.4239 10.2192 20.6613 9.81909 20.5541C9.41899 20.4469 9.18156 20.0356 9.28876 19.6355L13.2624 4.80583C13.3696 4.40573 13.7808 4.16829 14.1809 4.2755Z"
                  fill="#000000"
                />
                <path
                  d="M16.4425 7.32781C16.7196 7.01993 17.1938 6.99497 17.5017 7.27206L19.2392 8.8358C19.9756 9.49847 20.5864 10.0482 21.0058 10.5467C21.4468 11.071 21.7603 11.6342 21.7603 12.3295C21.7603 13.0248 21.4468 13.5881 21.0058 14.1123C20.5864 14.6109 19.9756 15.1606 19.2392 15.8233L17.5017 17.387C17.1938 17.6641 16.7196 17.6391 16.4425 17.3313C16.1654 17.0234 16.1904 16.5492 16.4983 16.2721L18.1947 14.7452C18.9826 14.0362 19.5138 13.5558 19.8579 13.1467C20.1882 12.7541 20.2603 12.525 20.2603 12.3295C20.2603 12.1341 20.1882 11.9049 19.8579 11.5123C19.5138 11.1033 18.9826 10.6229 18.1947 9.91383L16.4983 8.387C16.1904 8.10991 16.1654 7.63569 16.4425 7.32781Z"
                  fill="#000000"
                />
                <path
                  d="M7.50178 8.387C7.80966 8.10991 7.83462 7.63569 7.55752 7.32781C7.28043 7.01993 6.80621 6.99497 6.49833 7.27206L4.76084 8.8358C4.0245 9.49847 3.41369 10.0482 2.99428 10.5467C2.55325 11.071 2.23975 11.6342 2.23975 12.3295C2.23975 13.0248 2.55325 13.5881 2.99428 14.1123C3.41369 14.6109 4.02449 15.1606 4.76082 15.8232L6.49833 17.387C6.80621 17.6641 7.28043 17.6391 7.55752 17.3313C7.83462 17.0234 7.80966 16.5492 7.50178 16.2721L5.80531 14.7452C5.01743 14.0362 4.48623 13.5558 4.14213 13.1467C3.81188 12.7541 3.73975 12.525 3.73975 12.3295C3.73975 12.1341 3.81188 11.9049 4.14213 11.5123C4.48623 11.1033 5.01743 10.6229 5.80531 9.91383L7.50178 8.387Z"
                  fill="#000000"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
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
          <div className="border border-gray-300 rounded-md overflow-hidden">
            <EditorProvider
              initialConfig={{
                schemaDefinition,
                initialValue: ensureKeys(formData.description),
              }}
            >
              <RichTextToolbar />
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
                  placeholder="Enter property description. Use the toolbar above for formatting options..."
                  renderDecorator={renderDecorator}
                  renderStyle={renderStyle}
                  renderBlock={(props) => <div>{props.children}</div>}
                  renderListItem={(props) => <>{props.children}</>}
                  style={{
                    minHeight: "200px",
                    padding: "16px",
                    border: "none",
                    outline: "none",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    fontFamily:
                      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
                  }}
                />
              </div>
            </EditorProvider>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Rich text editor supports text formatting. Press{" "}
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd>{" "}
            for new paragraphs.
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
