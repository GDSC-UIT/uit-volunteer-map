import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";
import type { Team } from "./Team.js";
import type { Account } from "./Account.js";
import type { Post } from "./Post.js";

@Entity("User")
export class User {
  @PrimaryGeneratedColumn({ name: "UserId" })
  userId!: number;

  @Column("text", { name: "FullName", nullable: false })
  fullName!: string;

  @Column("text", { name: "Mssv", nullable: true })
  mssv?: string | null;

  @Column("text", { name: "Class", nullable: true })
  class?: string | null;

  @Column("text", { name: "Email", nullable: false, unique: true })
  email!: string;

  @Column("text", { name: "PhoneNumber", nullable: true })
  phoneNumber?: string | null;

  @Column("text", { name : "avatarUrl", nullable: true })
  avatarUrl?: string | null;

  @Column("integer", { name: "isDeleted", nullable: false, default: 0 })
  isDeleted!: number;

  @ManyToOne("Team", "users")
  @JoinColumn({ name: "TeamId" })
  team!: Relation<Team>;

  @OneToOne("Account", "user")
  @JoinColumn({ name: "AccId" })
  account?: Relation<Account>;

  @OneToMany("Post", "author")
  posts!: Relation<Post[]>;
}
