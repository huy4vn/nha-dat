import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Define expected request body format
interface DeleteImageRequest {
  url: string;
}

// Ensure the Cloudinary SDK is configured
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(request: Request) {
  try {
    const body: DeleteImageRequest = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
    }

    // Example Cloudinary URL:
    // https://res.cloudinary.com/dowobggqv/image/upload/v1717056024/nha-dat/h872yhj78yq21.jpg
    
    // Extract public_id
    // It's usually the part after /upload/ and any /vXXXXX/ version string, up to the file extension
    const urlParts = url.split('/upload/');
    if (urlParts.length !== 2) {
      return NextResponse.json({ error: 'Invalid Cloudinary URL' }, { status: 400 });
    }

    let publicIdWithExtension = urlParts[1];
    
    // Remove versioning (e.g. v1717056024/) if present
    if (publicIdWithExtension.match(/^v\d+\//)) {
      publicIdWithExtension = publicIdWithExtension.replace(/^v\d+\//, '');
    }

    // Remove file extension
    const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));

    if (!publicId) {
      return NextResponse.json({ error: 'Could not extract public_id' }, { status: 400 });
    }

    // Call Cloudinary API to delete
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok' && result.result !== 'not found') {
      console.error('Cloudinary deletion failed:', result);
      return NextResponse.json({ error: 'Failed to delete from Cloudinary' }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: result.result });

  } catch (error: any) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
