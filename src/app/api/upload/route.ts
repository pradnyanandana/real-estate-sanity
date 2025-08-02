import { NextResponse } from "next/server";
import { client } from "@/sanity/client";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("image") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  try {
    const asset = await client.assets.upload("image", file, {
      filename: file.name,
    });

    return NextResponse.json({ asset });
  } catch (error) {
    console.error("Upload failed", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
