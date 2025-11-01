import { prisma } from "../infrastructure/db/prismaClient";
import { scheduleGroupUserSync } from "../infrastructure/queue/groupUserSyncScheduler";
import { addGroupUsersToDB } from "../infrastructure/telegram/client/AddGroupUsersToDB";

(async () => {
    console.log(`🚀 Running job - Sync group users`);

    // اپراتورهای فعال
    const operators = await prisma.operator.findMany({
      where: { enabled: true },
    });

    console.log(`Found ${operators.length} active operators.`);

    for (const op of operators) {
      try {
        console.log(`👤 Syncing for operator ${op.name || op.id}`);
        await addGroupUsersToDB(op.apiId, op.apiHash,op.id,op.session);
        console.log(`✅ Done for ${op.name || op.id}`);
      } catch (err) {
        console.error(`❌ Failed for ${op.name || op.id}:`, err);
      }
    }

    console.log("🎯 All operators processed.");
})();