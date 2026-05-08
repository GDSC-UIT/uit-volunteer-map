import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    type Relation,
  } from "typeorm";
import type { Campaign } from "./Campaign.js";
import { Team } from "./Team.js";

@Entity("Attachment")
export class Attachment {
  @PrimaryGeneratedColumn({ name: "AttachmentId" })
  attachmentId!: number;

  @Column("text", { name: "ImageUrl", nullable: false, unique: true })
  imageUrl!: string;

  @Column("text", { name: "UploadedAt", nullable: false })
  uploadedAt!: string;

  @Column("integer", { name: "position", nullable: true })
  position?: number;

  @ManyToOne("Campaign", "attachments", { nullable: true })
  @JoinColumn({ name: "CampaignId" })
  campaign?: Relation<Campaign>;

  @ManyToOne("Team", "attachments", { nullable: true })
  @JoinColumn({ name: "TeamId" })
  team?: Relation<Team>;
}
