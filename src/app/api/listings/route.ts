import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Basic validation
    if (!body.title || !body.location || !body.price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate a slug from title
    const generateSlug = (title: string) => {
      return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .trim();
    };

    const newDoc = {
      _type: "property",
      title: body.title,
      slug: {
        _type: "slug",
        current: generateSlug(body.title),
      },
      location: body.location,
      price: parseInt(body.price),
      description: [
        {
          _type: "block",
          children: [
            {
              _type: "span",
              text: body.description || "",
            },
          ],
        },
      ],
      isPublished: true,
      ...(body.imageAssetId && {
        image: {
          _type: "image",
          asset: {
            _type: "reference",
            _ref: body.imageAssetId,
          },
        },
      }),
    };

    const created = await client.create(newDoc);

    return NextResponse.json({ success: true, document: created });
  } catch (err) {
    console.error("Error saving listing:", err);
    return NextResponse.json(
      { error: "Failed to save listing" },
      { status: 500 }
    );
  }
}
