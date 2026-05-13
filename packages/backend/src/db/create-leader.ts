import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { AppDataSource } from "./data-source.js";
import { Account } from "../entities/Account.js";
import { User } from "../entities/User.js";
import { Role } from "../entities/Role.js";
import { RoleEnum } from "@uit-volunteer-map/shared";
import bcrypt from "bcrypt";

dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

await AppDataSource.initialize();

const roleRepo = AppDataSource.getRepository(Role);
const accountRepo = AppDataSource.getRepository(Account);
const userRepo = AppDataSource.getRepository(User);

const leaderRole = await roleRepo.findOneBy({ roleName: RoleEnum.LEADER });
if (!leaderRole) {
  console.log("Leader role not found!");
  process.exit(1);
}

let leaderAccount = await accountRepo.findOneBy({ username: "leader" });
if (!leaderAccount) {
  const hashed = await bcrypt.hash("leader123", 10);
  leaderAccount = accountRepo.create({
    username: "leader",
    password: hashed,
    roleId: leaderRole.roleId,
    role: leaderRole,
  });
  await accountRepo.save(leaderAccount);
  console.log("Created leader account: username=leader, password=leader123");
} else {
  console.log("Leader account already exists");
}

const existsUser = await userRepo.findOneBy({ account: { accId: leaderAccount.accId } });
if (!existsUser) {
  const user = userRepo.create({
    fullName: "Leader User",
    email: "leader@example.com",
    account: leaderAccount,
  });
  await userRepo.save(user);
  console.log("Created leader user:", user);
} else {
  console.log("Leader user already exists, userId:", existsUser.userId);
}

await AppDataSource.destroy();