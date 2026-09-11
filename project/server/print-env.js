// One-off diagnostic — run via cPanel's Node.js app "Run JS script" button to see
// exactly what env vars actually reach the process (values masked, existence only).
// Delete this file once the deployment issue is resolved; it's not part of the app.
const keys = [
  "NODE_ENV",
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "DATABASE_URL",
  "JWT_SECRET",
];

for (const key of keys) {
  const val = process.env[key];
  console.log(`${key} = ${val === undefined ? "<undefined>" : val === "" ? "<empty string>" : "<set, " + val.length + " chars>"}`);
}
