import * as dotenv from 'dotenv';

// Load .env file
dotenv.config();

console.log("ADMIN_PASSWORD_HASH:", process.env.ADMIN_PASSWORD_HASH);
console.log("Length:", process.env.ADMIN_PASSWORD_HASH?.length);
console.log("\nFull .env path:", require('path').resolve('.env'));
console.log("Current working directory:", process.cwd());