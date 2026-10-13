import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/dal';
import {
  ALLOWED_AVATAR_CONTENT_TYPES,
  MAX_AVATAR_BYTES,
  getAvatarExtension,
  isAllowedAvatarExtension,
  isValidAvatarPathname,
} from '@/lib/avatar';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const user = await getCurrentUser();
        if (!user) {
          throw new Error('Unauthorized');
        }

        const ext = getAvatarExtension(pathname);
        if (!isAllowedAvatarExtension(ext)) {
          throw new Error('Only JPG and PNG images are allowed');
        }

        if (!isValidAvatarPathname(pathname, user.id)) {
          throw new Error('Invalid upload path');
        }

        return {
          allowedContentTypes: [...ALLOWED_AVATAR_CONTENT_TYPES],
          maximumSizeInBytes: MAX_AVATAR_BYTES,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({ userId: user.id }),
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}
