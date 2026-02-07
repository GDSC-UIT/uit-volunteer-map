import { DataSource } from "typeorm";
import { Role } from "../../entities/Role.js";
import { RoleEnum } from "@uit-volunteer-map/shared";

export const seedRoles = async (dataSource: DataSource) => {
  const roleRepo = dataSource.getRepository(Role);

  const roles = [
    { roleId: 1, roleName: RoleEnum.ADMIN },
    { roleId: 2, roleName: RoleEnum.LEADER },
    { roleId: 3, roleName: RoleEnum.VICELEADER },
  ];

  for (const r of roles) {
    const exists = await roleRepo.findOneBy({ roleId: r.roleId });
    if (!exists) {
      await roleRepo.save(roleRepo.create(r));
    }
  }

  console.log("Roles seeded");
};
