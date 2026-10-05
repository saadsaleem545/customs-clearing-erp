import { NextResponse } from "next/server";
import { uploadFileToS3 } from "@/lib/s3";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Koi file upload nahi ki gayi!" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // S3 par file upload karne ke liye function call karein
    const fileUrl = await uploadFileToS3(buffer, file.name, file.type);

    return NextResponse.json({
      success: true,
      fileUrl: fileUrl,
      fileName: file.name,
    });
  } catch (error: any) {
    console.error("S3 Upload Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "File upload karte waqt masla aa gaya!" },
      { status: 500 }
    );
  }
}