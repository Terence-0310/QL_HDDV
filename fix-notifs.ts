const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const notifs = await p.notification.findMany({
    where: { title: { contains: "HD-2026-" } }
  });
  const contracts = await p.contract.findMany({ select: { id: true, code: true } });
  const map = new Map(contracts.map((c: any) => [c.code, c.id]));
  
  let updated = 0;
  for (const n of notifs) {
    const match = n.title.match(/HD-2026-\d+/);
    if (match) {
      const id = map.get(match[0]);
      if (id) {
        await p.notification.update({
          where: { id: n.id },
          data: { relatedEntityType: "CONTRACT", relatedEntityId: id }
        });
        updated++;
      }
    }
  }
  console.log(`Updated ${updated} notifications with Contract ID`);
}
run();
