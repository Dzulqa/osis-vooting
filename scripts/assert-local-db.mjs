// Guard for destructive local commands (db:reset): only run against a database on this machine.
const raw = process.env.DATABASE_URL || "";
let host = "";
try {
  host = new URL(raw).hostname;
} catch {
  console.error("DATABASE_URL is missing or invalid; refusing to continue.");
  process.exit(1);
}

if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(host)) {
  console.error(`Refusing: DATABASE_URL points at "${host}", not a local database. This command would wipe it.`);
  process.exit(1);
}
