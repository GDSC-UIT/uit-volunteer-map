import { campaignDto } from '../transport/read.js';
import { AppDataSource } from '../db/data-source.js';
import { Campaign } from '../entities/Campaign.js';
import { CreateCampaignInput, UpdateCampaignInput } from '../schemas/campaign.js';
import { HttpError } from '../errors/HttpError.js';
import { HTTP_STATUS, CAMPAIGN_ERRORS } from '@uit-volunteer-map/shared';
import { Team } from '../entities/Team.js';
import { Attachment } from '../entities/Attachment.js';
import { lifecycleTransaction } from './lifecycleTransaction.js';

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
    return lifecycleTransaction(async manager => {
      const repo = manager.getRepository(Campaign);
      if (await repo.existsBy({ campaignName: data.campaignName })) throw new HttpError(CAMPAIGN_ERRORS.ALREADY_EXISTS, 409);
      return campaignDto(await repo.save(repo.create(data)));
    });
  }

  // 4. UPDATE
  async update(id: number, data: UpdateCampaignInput) {
    return lifecycleTransaction(async manager => {
      const repo = manager.getRepository(Campaign);
      const campaign = await repo.findOne({where:{campaignId:id},relations:['attachments']});
      if (!campaign) throw new HttpError(CAMPAIGN_ERRORS.NOT_FOUND, 404);
      if (data.campaignName && data.campaignName !== campaign.campaignName && await repo.existsBy({campaignName:data.campaignName})) throw new HttpError(CAMPAIGN_ERRORS.ALREADY_EXISTS, 409);
      repo.merge(campaign, data);
      if (campaign.endDate < campaign.startDate) throw new HttpError('Ngày kết thúc phải từ ngày bắt đầu trở đi.', 400);
      return campaignDto(await repo.save(campaign));
    });
  }

  // 5. DELETE
  async delete(id: number) {
    return lifecycleTransaction(async manager => {
      if (!await manager.getRepository(Campaign).existsBy({campaignId:id})) throw new HttpError(CAMPAIGN_ERRORS.NOT_FOUND, 404);
      if (await manager.getRepository(Team).existsBy({campaign:{campaignId:id}}) || await manager.getRepository(Attachment).existsBy({campaign:{campaignId:id}})) {
        throw new HttpError('Chiến dịch còn đội hình hoặc ảnh đính kèm, không thể xóa.', 409);
      }
      await manager.getRepository(Campaign).delete(id);
      return true;
    });
  }
}
