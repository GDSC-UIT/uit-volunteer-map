import { DataSource, type EntityManager } from "typeorm";
import { Role } from "../../entities/Role.js";
import { RoleEnum } from "@uit-volunteer-map/shared";

export const seedRoles = async (dataSource: DataSource | EntityManager) => {
  const repo = dataSource.getRepository(Role);
  for (const roleName of [RoleEnum.ADMIN, RoleEnum.LEADER]) {
    const existing = await repo.findBy({ roleName });
    if (existing.length > 1) throw new Error('Ambiguous role names; reconcile existing roles before seeding.');
    if (!existing.length) await repo.save(repo.create({ roleName }));
  }
};
