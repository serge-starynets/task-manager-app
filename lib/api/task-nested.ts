import { z } from 'zod';
import { canAccessTask } from '@/lib/api/tasks';
import {
  isApiUser,
  parseIdParam,
  requireApiUser,
  serviceFailureToBody,
} from '@/lib/api/handler';
import { attachmentToDto, relatedTaskToDto } from '@/lib/api/mappers';
import {
  revalidateRelatedTaskViews,
  revalidateTaskDetail,
} from '@/lib/api/revalidate';
import {
  jsonCreated,
  jsonError,
  jsonMessage,
  jsonNotFound,
  jsonOk,
} from '@/lib/api/responses';
import { getRelatedTasks, getTaskAttachments } from '@/lib/dal';
import {
  addTaskRelation,
  removeTaskRelation,
} from '@/lib/services/relation-service';
import { registerTaskAttachmentForUser } from '@/lib/services/attachment-service';
import { RegisterAttachmentSchema } from '@/lib/validations/attachment';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const RelationBodySchema = z.object({
  targetId: z.number().int().positive(),
});

export async function GETRelations(_request: Request, context: RouteContext) {
  try {
    const userOrResponse = await requireApiUser();
    if (!isApiUser(userOrResponse)) return userOrResponse;

    const { id } = await context.params;
    const taskId = parseIdParam(id);
    if (taskId === null) return jsonNotFound();

    const allowed = await canAccessTask(userOrResponse, taskId);
    if (!allowed) return jsonNotFound();

    const related = await getRelatedTasks(taskId);
    return jsonOk(related.map(relatedTaskToDto));
  } catch (error) {
    console.error('Error fetching task relations:', error);
    return jsonError('Failed to fetch relations', 500);
  }
}

export async function POSTRelation(request: Request, context: RouteContext) {
  try {
    const userOrResponse = await requireApiUser();
    if (!isApiUser(userOrResponse)) return userOrResponse;

    const { id } = await context.params;
    const taskId = parseIdParam(id);
    if (taskId === null) return jsonNotFound();

    const body = await request.json();
    const parsed = RelationBodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Validation failed', 400, {
        targetId: ['targetId must be a positive integer'],
      });
    }

    const result = await addTaskRelation(taskId, parsed.data.targetId);
    if (!result.ok) {
      const failure = serviceFailureToBody(result);
      return jsonError(failure.error, failure.status);
    }

    revalidateRelatedTaskViews(taskId, parsed.data.targetId);
    return jsonMessage('Related task added', 201);
  } catch (error) {
    console.error('Error adding task relation:', error);
    return jsonError('Failed to add relation', 500);
  }
}

export async function DELETERelation(
  request: Request,
  context: RouteContext,
) {
  try {
    const userOrResponse = await requireApiUser();
    if (!isApiUser(userOrResponse)) return userOrResponse;

    const { id } = await context.params;
    const taskId = parseIdParam(id);
    if (taskId === null) return jsonNotFound();

    const { searchParams } = new URL(request.url);
    const targetId = parseIdParam(searchParams.get('targetId') ?? '');
    if (targetId === null) {
      return jsonError('targetId query parameter is required', 400);
    }

    const result = await removeTaskRelation(taskId, targetId);
    if (!result.ok) {
      const failure = serviceFailureToBody(result);
      return jsonError(failure.error, failure.status);
    }

    revalidateRelatedTaskViews(taskId, targetId);
    return jsonMessage('Related task removed');
  } catch (error) {
    console.error('Error removing task relation:', error);
    return jsonError('Failed to remove relation', 500);
  }
}

export async function GETAttachments(_request: Request, context: RouteContext) {
  try {
    const userOrResponse = await requireApiUser();
    if (!isApiUser(userOrResponse)) return userOrResponse;

    const { id } = await context.params;
    const taskId = parseIdParam(id);
    if (taskId === null) return jsonNotFound();

    const allowed = await canAccessTask(userOrResponse, taskId);
    if (!allowed) return jsonNotFound();

    const attachments = await getTaskAttachments(taskId);
    return jsonOk(attachments.map(attachmentToDto));
  } catch (error) {
    console.error('Error fetching task attachments:', error);
    return jsonError('Failed to fetch attachments', 500);
  }
}

export async function POSTAttachment(request: Request, context: RouteContext) {
  try {
    const userOrResponse = await requireApiUser();
    if (!isApiUser(userOrResponse)) return userOrResponse;

    const { id } = await context.params;
    const taskId = parseIdParam(id);
    if (taskId === null) return jsonNotFound();

    const body = await request.json();
    const parsed = RegisterAttachmentSchema.safeParse({
      ...body,
      taskId,
    });
    if (!parsed.success) {
      return jsonError('Invalid attachment data', 400);
    }

    const result = await registerTaskAttachmentForUser(
      userOrResponse.id,
      parsed.data,
    );
    if (!result.ok) {
      const failure = serviceFailureToBody(result);
      return jsonError(failure.error, failure.status);
    }

    revalidateTaskDetail(taskId);
    return jsonCreated(attachmentToDto(result.data));
  } catch (error) {
    console.error('Error registering attachment:', error);
    return jsonError('Failed to save attachment', 500);
  }
}
