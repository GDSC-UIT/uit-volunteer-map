import { AppDataSource } from "./data-source.js";

await AppDataSource.initialize();
const accounts = await AppDataSource.query("SELECT accId, username, roleId FROM Account");
console.log(accounts);
await AppDataSource.destroy();