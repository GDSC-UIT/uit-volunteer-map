import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";
import type { Role } from "./Role.js";
import type { User } from "./User.js";

@Entity("Account")
export class Account {
  @PrimaryGeneratedColumn({ name: "AccID" })
  accId!: number;

  @Column("text", { name: "Username", nullable: false, unique: true })
  username!: string;

  @Column("text", { name: "Password", nullable: false })
  password!: string;

  @Column("integer", { name: "RoleId", nullable: false })
  roleId!: number;

  @Column("text", { name: "CreateAt", nullable: true })
  createdAt?: string | null;

  @Column("text", { name: "UpdatedAt", nullable: true })
  updatedAt?: string | null;

  @ManyToOne("Role", "accounts")
  @JoinColumn({ name: "RoleId" })
  role!: Relation<Role>;

  @OneToOne("User", "account")
  user?: Relation<User>;
}
