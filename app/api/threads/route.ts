import { getDb } from '@/lib/db/connection';
import { listThreads, createThread } from '@/lib/db/thread-repository';
import { getUserId } from '@/lib/user-id';

export async function GET(): Promise<Response> {
  try {
    const userId = await getUserId();
    const db = getDb();
    const allThreads = listThreads(db, userId);

    return Response.json({
      threads: allThreads.map((t) => ({
        remoteId: t.id,
        status: t.status,
        title: t.title,
        externalId: undefined,
      })),
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
