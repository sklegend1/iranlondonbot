/**
 * Minimal sender extractor used by message scraping.
 * Adjust if your gramjs version returns different shapes.
 */
export function extractSenderInfo(msg: any) {
    try {
      if (msg.senderId && typeof msg.senderId === "object") {
        if ("userId" in msg.senderId) return { id: Number(msg.senderId.userId) };
        if ("user_id" in msg.senderId) return { id: Number((msg.senderId as any).user_id) };
      }
      if (msg.fromId && typeof msg.fromId === "object") {
        if ("userId" in msg.fromId) return { id: Number(msg.fromId.userId) };
        if ("user_id" in msg.fromId) return { id: Number((msg.fromId as any).user_id) };
      }
      if ("senderUserId" in msg) return { id: Number((msg as any).senderUserId) };
      if (msg.from && typeof msg.from === "object") {
        const u = msg.from;
        if ("id" in u) {
          return { id: Number(u.id), username: u.username ?? null, firstName: u.firstName ?? u.first_name ?? null, lastName: u.lastName ?? u.last_name ?? null };
        }
      }
      if ((msg as any).sender && (msg as any).sender.id) return { id: Number((msg as any).sender.id) };
      if (msg.peerId && typeof msg.peerId === "object" && "userId" in msg.peerId) return { id: Number(msg.peerId.userId) };
    } catch (e) {
      // swallow
    }
    return null;
  }