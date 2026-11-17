import { campaignDto } from '../transport/read.js';
import { AppDataSource } from '../db/data-source.js';
import { Campaign } from '../entities/Campaign.js';
import { CreateCampaignInput, UpdateCampaignInput } from '../schemas/campaign.js';
import { HttpError } from '../errors/HttpError.js';
import { HTTP_STATUS, CAMPAIGN_ERRORS } from '@uit-volunteer-map/shared';

export class CampaignService {
  private campaignRepo = AppDataSource.getRepository(Campaign);

  // 1. GET ALL
  async getAll() {
    return (await this.campaignRepo.find({ relations: ['attachments'], order: { campaignId: 'ASC' } })).map(campaignDto);
  }

  // 2. GET ONE
  async getOne(id: number) {
    return campaignDto(await this.getEntity(id));
  }

  private async getEntity(id: number) {
    const campaign = await this.campaignRepo.findOne({ where: { campaignId: id }, relations: ['attachments'] });
    if (!campaign) throw new HttpError(CAMPAIGN_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    return campaign;
  }

  // 3. CREATE
  async create(data: CreateCampaignInput) {
    const existing = await this.campaignRepo.findOneBy({ campaignName: data.campaignName });
    if (existing) throw new HttpError(CAMPAIGN_ERRORS.ALREADY_EXISTS, HTTP_STATUS.CONFLICT);

    const newCampaign = this.campaignRepo.create(data);
    return await this.campaignRepo.save(newCampaign);
  }

  // 4. UPDATE
  async update(id: number, data: UpdateCampaignInput) {
    const campaign = await this.getEntity(id);
    this.campaignRepo.merge(campaign, data);
    return await this.campaignRepo.save(campaign);
  }

  // 5. DELETE
  async delete(id: number) {
    const result = await this.campaignRepo.delete(id);
    if (result.affected === 0) throw new HttpError(CAMPAIGN_ERRORS.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    return true;
  }
}
