// Creates .env from .env.example on first run so `npm install && npm run dev` works with no manual steps.
import { copyFileSync, existsSync } from "node:fs";

if (!existsSync(".env")) {
  copyFileSync(".env.example", ".env");
  console.log("Created .env from .env.example");
}
