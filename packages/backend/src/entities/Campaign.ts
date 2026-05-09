import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";
import type { Team } from "./Team.js";
import type { Attachment } from "./Attachment.js";

@Entity("Campaign")
export class Campaign {
  @PrimaryGeneratedColumn({ name: "CampaignId" })
  campaignId!: number;

  @Column("text", { name: "CampaignName", nullable: false, unique: true })
  campaignName!: string;

  @Column("text", { name: "StartDate", nullable: false })
  startDate!: string;

  @Column("text", { name: "EndDate", nullable: false })
  endDate!: string;

  @Column("text", { name: "Description", nullable: true })
  description?: string | null;

  @OneToMany("Team", "campaign")
  teams!: Relation<Team[]>;

  @OneToMany("Attachment", "campaign")
  attachments!: Relation<Attachment[]>;
}
