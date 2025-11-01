import { inviteFromDB } from "../infrastructure/telegram/client/InviteFromDB";

(async () => {
    const  target  = 'iranian_london23';
    console.log(`🚀 Starting invite job for target group: ${target}`);
    try {
      await inviteFromDB(target);
      console.log(`✅ Finished inviting for ${target}`);
    } catch (err) {
      console.error(`❌ Error in invite job for ${target}:`, err);
      throw err; // اجازه بده BullMQ وضعیت fail رو ثبت کنه
    }
  })();