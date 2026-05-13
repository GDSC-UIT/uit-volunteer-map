import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { AppDataSource } from "./data-source.js";
import { User } from "../entities/User.js";
import { Account } from "../entities/Account.js";

dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

await AppDataSource.initialize();

const userRepo = AppDataSource.getRepository(User);
const accountRepo = AppDataSource.getRepository(Account);

const admin = await accountRepo.findOneBy({ username: "admin" });
if (!admin) {
  console.log("Admin account not found!");
  process.exit(1);
}

const exists = await userRepo.findOneBy({ account: { accId: admin.accId } });
if (exists) {
  console.log("User already exists:", exists);
} else {
  const user = userRepo.create({
    fullName: "Admin User",
    email: "admin@example.com",
    account: admin,
  });
  await userRepo.save(user);
  console.log("Created user:", user);
}

await AppDataSource.destroy();