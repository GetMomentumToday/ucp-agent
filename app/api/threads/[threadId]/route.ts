import { getDb } from '@/lib/db/connection';
import { getThread, updateThread, deleteThread } from '@/lib/db/thread-repository';
import { getUserId } from '@/lib/user-id';

type RouteContext = { params: Promise<{ threadId: string }> };

export async function GET(_req: Request, ctx: RouteContext): Promise<Response> {
  try {
    const userId = await getUserId();
    const { threadId } = await ctx.params;
    const db = getDb();
    const thread = getThread(db, threadId, userId);

    if (!thread) {
      return Response.json({ error: 'Thread not found' }, { status: 404 });
    }

    return Response.json({
      remoteId: thread.id,
      status: thread.status,
      title: thread.title,
      externalId: undefined,
    });
  } catch (error) {
    console.error('[thread GET] error:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: RouteContext): Promise<Response> {
  try {
    const userId = await getUserId();
    const { threadId } = await ctx.params;
    const body = (await req.json()) as {
      title?: string;
      status?: 'regular' | 'archived';
    };

    const db = getDb();
    const updated = updateThread(db, threadId, userId, body);

    if (!updated) {
      return Response.json({ error: 'Thread not found' }, { status: 404 });
    }

    return Response.json({
      remoteId: updated.id,
      status: updated.status,
      title: updated.title,
      externalId: undefined,
    });
  } catch (error) {
    console.error('[thread PATCH] error:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: RouteContext): Promise<Response> {
  try {
    const userId = await getUserId();
    const { threadId } = await ctx.params;
    const db = getDb();
    deleteThread(db, threadId, userId);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('[thread DELETE] error:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
