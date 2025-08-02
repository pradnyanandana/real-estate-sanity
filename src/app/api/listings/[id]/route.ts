import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/client";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing document ID" }, { status: 400 });
  }

  try {
    const deletedDoc = await client.delete(id);
    return NextResponse.json({ success: true, deletedDoc });
  } catch (error) {
    console.error("Failed to delete:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!id || !body) {
      return NextResponse.json(
        { message: "Missing ID or data" },
        { status: 400 }
      );
    }

    const { title, location, price, description, image } = body;

    // Sanity patch request
    await client
      .patch(id)
      .set({
        title,
        location,
        price,
        description: [
          {
            _type: "block",
            children: [
              {
                _type: "span",
                text: description,
              },
            ],
          },
        ],
        image,
      })
      .commit();

    return NextResponse.json(
      { message: "Listing updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PUT /api/listings/[id]]", error);
    return NextResponse.json(
      { message: "Failed to update listing" },
      { status: 500 }
    );
  }
}
