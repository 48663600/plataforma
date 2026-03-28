const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function getState() {
  const row = await prisma.appState.findUnique({ where: { id: 1 } });
  if (!row?.data) return null;
  try { return JSON.parse(row.data); } catch { return null; }
}
async function setState(newData) {
  const payload = JSON.stringify(newData);
  await prisma.appState.upsert({
    where: { id: 1 },
    update: { data: payload },
    create: { id: 1, data: payload },
  });
}
module.exports = { getState, setState };
