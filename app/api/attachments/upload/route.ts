import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getCurrentUser, canManageTask } from '@/lib/dal';
import {
  ALLOWED_CONTENT_TYPES,
  MAX_ATTACHMENT_BYTES,
  getExtension,
  isAllowedExtension,
  isValidDraftPathname,
  isValidTaskPathname,
} from '@/lib/attachments';

type ClientPayload = {
  taskId?: number;
  uploadSessionId?: string;
};

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = await getCurrentUser();
        if (!user) {
          throw new Error('Unauthorized');
        }

        let payload: ClientPayload = {};
        try {
          payload = clientPayload ? JSON.parse(clientPayload) : {};
        } catch {
          throw new Error('Invalid upload payload');
        }

        const ext = getExtension(pathname);
        if (!isAllowedExtension(ext)) {
          throw new Error(`File type .${ext || '?'} is not allowed`);
        }

        if (payload.taskId != null) {
          const taskId = Number(payload.taskId);
          if (!Number.isFinite(taskId)) {
            throw new Error('Invalid task');
          }
          const allowed = await canManageTask(taskId);
          if (!allowed) {
            throw new Error('Forbidden');
          }
          if (!isValidTaskPathname(pathname, taskId)) {
            throw new Error('Invalid upload path');
          }
        } else if (payload.uploadSessionId) {
          if (
            typeof payload.uploadSessionId !== 'string' ||
            payload.uploadSessionId.length < 8 ||
            payload.uploadSessionId.length > 64
          ) {
            throw new Error('Invalid upload session');
          }
          if (
            !isValidDraftPathname(pathname, user.id, payload.uploadSessionId)
          ) {
            throw new Error('Invalid upload path');
          }
        } else {
          throw new Error('Missing task or upload session');
        }

        return {
          allowedContentTypes: [...ALLOWED_CONTENT_TYPES],
          maximumSizeInBytes: MAX_ATTACHMENT_BYTES,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({
            userId: user.id,
            taskId: payload.taskId ?? null,
            uploadSessionId: payload.uploadSessionId ?? null,
          }),
        };
      },
      // No onUploadCompleted — it needs a public callback URL (fails on
      // localhost). Metadata is registered client-side / via createTask.
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}
