import { AppDataSource } from "../db/data-source.js"; 
import { Campaign } from "../entities/Campaign.js";
import { CreateCampaignInput, UpdateCampaignInput } from "../schemas/campaign.js";

export class CampaignService {
  private campaignRepo = AppDataSource.getRepository(Campaign);

  // 1. GET ALL
  async getAll() {
    return await this.campaignRepo.find();
  }

  // 2. GET ONE
  async getOne(id: number) {
    const campaign = await this.campaignRepo.findOneBy({ campaignId: id });
    if (!campaign) throw new Error("CAMPAIGN_NOT_FOUND");
    return campaign;
  }

  // 3. CREATE
  async create(data: CreateCampaignInput) {
    const existing = await this.campaignRepo.findOneBy({ campaignName: data.campaignName });
    if (existing) throw new Error("CAMPAIGN_EXISTS");

    const newCampaign = this.campaignRepo.create(data);
    return await this.campaignRepo.save(newCampaign);
  }

  // 4. UPDATE
  async update(id: number, data: UpdateCampaignInput) {
    const campaign = await this.getOne(id);
    this.campaignRepo.merge(campaign, data);
    return await this.campaignRepo.save(campaign);
  }

  // 5. DELETE
  async delete(id: number) {
    const result = await this.campaignRepo.delete(id);
    if (result.affected === 0) throw new Error("CAMPAIGN_NOT_FOUND");
    return true;
  }
}