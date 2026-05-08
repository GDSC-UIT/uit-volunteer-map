import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";
import type { User } from "./User.js";
import type { Photo } from "./Photo.js";
import type { Team } from "./Team.js";

@Entity("Post")
export class Post {
  @PrimaryGeneratedColumn({ name: "PostId" })
  postId!: number;

  @Column("text", { name: "Title", nullable: false })
  title!: string;

  @Column("text", { name: "Content", nullable: false })
  content!: string;

  @Column("integer", { name: "IsDeleted", nullable: false, default: 0 })
  isDeleted!: number;

  @Column("text", { name: "CreatedAt", nullable: false })
  createdAt!: string;

  @Column("text", { name: "UpdatedAt", nullable: false })
  updatedAt!: string;

  @ManyToOne("Team", "posts")
  @JoinColumn({ name: "TeamId" })
  team!: Relation<Team>;

  @ManyToOne("User", "posts")
  @JoinColumn({ name: "AuthorId" })
  author!: Relation<User>;

  @OneToMany("Photo", "post")
  photos!: Relation<Photo[]>;
}
