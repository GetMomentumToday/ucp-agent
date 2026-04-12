import { getDb } from '@/lib/db/connection';
import { listThreads, createThread } from '@/lib/db/thread-repository';
import { loadMessages } from '@/lib/db/message-repository';
import { getUserId } from '@/lib/user-id';

export async function GET(): Promise<Response> {
  try {
    const userId = await getUserId();
    const db = getDb();
    const allThreads = listThreads(db, userId);

    const firstRegular = allThreads.find((t) => t.status === 'regular');
    const latestMessages = firstRegular
      ? loadMessages(db, firstRegular.id).map((m) => ({
          id: m.id,
          parent_id: m.parentId,
          format: m.format,
          content: m.content,
        }))
      : undefined;

    return Response.json({
      threads: allThreads.map((t) => ({
        remoteId: t.id,
        status: t.status,
        title: t.title,
        externalId: undefined,
      })),
      latestThreadId: firstRegular?.id,
      latestMessages,
    });
  } catch (error) {
    console.error('[threads GET] error:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const userId = await getUserId();
    const body = (await req.json()) as { threadId?: string };
    const { threadId } = body;

    if (!threadId || typeof threadId !== 'string') {
      return Response.json({ error: 'threadId is required' }, { status: 400 });
    }

    const db = getDb();
    const thread = createThread(db, { id: threadId, userId });

    return Response.json({
      remoteId: thread.id,
      externalId: undefined,
    });
  } catch (error) {
    console.error('[threads POST] error:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
