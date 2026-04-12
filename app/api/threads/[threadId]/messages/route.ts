import { getDb } from '@/lib/db/connection';
import { loadMessages, appendMessage } from '@/lib/db/message-repository';
import { createThread } from '@/lib/db/thread-repository';
import { getUserId } from '@/lib/user-id';

type RouteContext = { params: Promise<{ threadId: string }> };

export async function GET(_req: Request, ctx: RouteContext): Promise<Response> {
  try {
    const { threadId } = await ctx.params;
    const db = getDb();
    const stored = loadMessages(db, threadId);

    return Response.json({
      messages: stored.map((m) => ({
        id: m.id,
        parent_id: m.parentId,
        format: m.format,
        content: m.content,
      })),
    });
  } catch (error) {
    console.error('[messages GET] error:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: RouteContext): Promise<Response> {
  try {
    const userId = await getUserId();
    const { threadId } = await ctx.params;
    const body = (await req.json()) as {
      id?: string;
      parent_id?: string | null;
      format?: string;
      content?: unknown;
    };

    if (!body.id || !body.format || body.content === undefined) {
      return Response.json(
        { error: 'id, format, and content are required' },
        { status: 400 },
      );
    }

    const db = getDb();
    createThread(db, { id: threadId, userId });

    appendMessage(db, threadId, {
      id: body.id,
      parentId: body.parent_id ?? null,
      format: body.format,
      content: body.content,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[messages POST] error:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
