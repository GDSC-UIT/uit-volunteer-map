import { AppDataSource } from "./data-source.js";
import { Account } from "../entities/Account.js";
import { Role } from "../entities/Role.js";
import { RoleEnum } from "@uit-volunteer-map/shared";
import bcrypt from "bcrypt";

await AppDataSource.initialize();

const roleRepo = AppDataSource.getRepository(Role);
const accountRepo = AppDataSource.getRepository(Account);

// Check roles
const roles = await roleRepo.find();
console.log("Roles:", roles);

// Check existing accounts
const accounts = await accountRepo.find();
console.log("Existing accounts:", accounts);

// Create admin if not exists
const adminRole = await roleRepo.findOneBy({ roleName: RoleEnum.ADMIN });
if (!adminRole) {
  console.log("No admin role found!");
  process.exit(1);
}

const exists = await accountRepo.findOneBy({ username: "admin" });
if (!exists) {
  const hashed = await bcrypt.hash("admin123", 10);
  const admin = accountRepo.create({
    username: "admin",
    password: hashed,
    roleId: adminRole.roleId,
    role: adminRole,
  });
  await accountRepo.save(admin);
  console.log("Created admin account: username=admin, password=admin123");
} else {
  console.log("Admin already exists:", exists.username);
}

await AppDataSource.destroy();