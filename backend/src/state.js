// Almacenamiento del estado del colegio.
//  - Con DATABASE_URL: PostgreSQL (Supabase) mediante Prisma, tabla "AppState".
//  - Sin DATABASE_URL: archivo JSON local (solo para desarrollo).
const fs = require("fs");
const path = require("path");

const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "..", "data", "state.json");
const usePrisma = Boolean(process.env.DATABASE_URL);
let prisma = null;
if (usePrisma) {
  const { PrismaClient } = require("@prisma/client");
  prisma = new PrismaClient();
}

async function getState() {
  if (!usePrisma) {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    } catch {
      return null;
    }
  }
  const row = await prisma.appState.findUnique({ where: { id: 1 } });
  if (!row?.data) return null;
  try {
    return JSON.parse(row.data);
  } catch {
    return null;
  }
}

async function setState(newData) {
  const payload = JSON.stringify(newData);
  if (!usePrisma) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    const tmp = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tmp, payload);
    fs.renameSync(tmp, DATA_FILE);
    return;
  }
  await prisma.appState.upsert({ where: { id: 1 }, update: { data: payload }, create: { id: 1, data: payload } });
}

const storageName = () => (usePrisma ? "postgresql" : `archivo ${DATA_FILE}`);
const disconnect = () => (prisma ? prisma.$disconnect() : Promise.resolve());

module.exports = { getState, setState, storageName, disconnect };
