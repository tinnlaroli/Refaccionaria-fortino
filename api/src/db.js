import { createDb } from "@refaccionaria/db";
import { config } from "./config.js";

const { db, client } = createDb(config.databaseUrl);

export { db, client };
