// Import env FIRST. It loads .env and validates it, so anything imported after
// this line can rely on configuration being present and correct.
import { env } from "./config/env.js";
import app from "./app.js";

app.listen(env.PORT, () => {
  console.log(`SplitLink API running on port ${env.PORT} [${env.NODE_ENV}]`);
});
