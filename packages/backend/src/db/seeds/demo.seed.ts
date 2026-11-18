import type { DataSource } from 'typeorm';
import bcrypt from 'bcrypt';
import { RoleEnum } from '@uit-volunteer-map/shared';
import { seedRoles } from './roles.seed.js';
import { Role } from '../../entities/Role.js';
import { Account } from '../../entities/Account.js';
import { User } from '../../entities/User.js';
import { Campaign } from '../../entities/Campaign.js';
import { Team } from '../../entities/Team.js';
import { Post } from '../../entities/Post.js';
import { Photo } from '../../entities/Photo.js';
import { Attachment } from '../../entities/Attachment.js';

export const DEMO = {
  campaignName: '[DEMO] Chiến dịch tình nguyện UIT',
  teamName: '[DEMO] Đội hình kết nối cộng đồng',
  usernames: ['demo-admin', 'demo-leader'],
  postTitles: ['[DEMO] Ngày hội sẻ chia', '[DEMO] Đồng hành cùng địa phương'],
} as const;
export async function seedDemo(db: DataSource, config: { adminPassword: string; leaderPassword: string }) {
  if (process.env.NODE_ENV === 'production') throw new Error('Demo seed is disabled in production.');
  for (const value of [config.adminPassword, config.leaderPassword]) {
    if (!value || value.length < 12 || Buffer.byteLength(value, 'utf8') > 72) throw new Error('Demo passwords require 12 characters and at most 72 UTF-8 bytes.');
  }
  return db.transaction(async manager => {
    const accounts = manager.getRepository(Account), campaigns = manager.getRepository(Campaign), teams = manager.getRepository(Team);
    const existing = await accounts.find({ where: DEMO.usernames.map(username => ({ username })), relations: ['role', 'user'] });
    const campaign = await campaigns.findOneBy({ campaignName: DEMO.campaignName });
    const team = await teams.findOne({ where: { teamName: DEMO.teamName }, relations: ['campaign'] });
    if (existing.length || campaign || team) {
      const complete = existing.length === 2 && campaign && team?.campaign?.campaignId === campaign.campaignId &&
        existing.every(account => account.user?.email === `${account.username}@example.test` &&
          account.role?.roleName === (account.username === DEMO.usernames[0] ? RoleEnum.ADMIN : RoleEnum.LEADER));
      if (!complete) throw new Error('Demo names conflict with incomplete/existing data; no automatic repair or overwrite.');
      const posts = await manager.getRepository(Post).find({where:DEMO.postTitles.map(title=>({title,team:{teamId:team.teamId}}))});
      if (posts.length !== 2) throw new Error('Demo data has been changed; no automatic repair.');
      return { created: false, campaignId: campaign.campaignId, teamId: team.teamId };
    }
    // Fresh demo only: historical bootstrap accounts are retained, never reset or reactivated.
    for (const entity of [Campaign,Team,Post,Photo,Attachment]) {
      if (await manager.getRepository(entity).count()) throw new Error('Demo seed requires an empty application dataset.');
    }
    const otherAccounts = await accounts.find();
    if (otherAccounts.some(account => !['admin','leader','leader2'].includes(account.username))) throw new Error('Demo seed refuses a database with non-bootstrap accounts.');
    const otherUsers = await manager.getRepository(User).find({relations:['account']});
    if (otherUsers.some(user => !user.account || !['admin','leader','leader2'].includes(user.account.username) || user.email !== `${user.account.username}@example.com`)) throw new Error('Demo seed refuses existing non-bootstrap profiles.');
    await seedRoles(manager);
    const users = manager.getRepository(User);
    const profiles: User[] = [];
    for (const [index, username] of DEMO.usernames.entries()) {
      const role = await manager.getRepository(Role).findOneByOrFail({ roleName: index === 0 ? RoleEnum.ADMIN : RoleEnum.LEADER });
      const account = await accounts.save(accounts.create({ username, password: await bcrypt.hash(index === 0 ? config.adminPassword : config.leaderPassword, 10), roleId: role.roleId }));
      profiles.push(await users.save(users.create({ fullName: index === 0 ? '[DEMO] Quản trị viên' : '[DEMO] Chỉ huy', email: username+'@example.test', mssv: '9900000'+index, class:'DEMO', account:{accId:account.accId} })));
    }
    const createdCampaign = await campaigns.save(campaigns.create({campaignName:DEMO.campaignName,description:'Dữ liệu minh họa tổng hợp; không phải hoạt động hoặc thông tin cá nhân thật.',startDate:'2026-01-01',endDate:'2026-12-31'}));
    const createdTeam = await teams.save(teams.create({teamName:DEMO.teamName,description:'Đội hình minh họa để thử luồng Guest, Admin và Leader.',campaign:{campaignId:createdCampaign.campaignId},leader:{userId:profiles[1].userId},imageUrl:'/Homepage_Logo.svg'}));
    await users.update(profiles[1].userId,{team:{teamId:createdTeam.teamId}});
    const posts = manager.getRepository(Post), photos = manager.getRepository(Photo);
    for (const [index,title] of DEMO.postTitles.entries()) {
      const post = await posts.save(posts.create({title,content:'Nội dung và tọa độ minh họa, không đại diện cho sự kiện đã diễn ra.',team:{teamId:createdTeam.teamId},author:{userId:profiles[1].userId},
        latitude:index===0?10.8231:16.0471,longitude:index===0?106.6296:108.2062,createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z'}));
      await photos.save(photos.create({imageUrl:`/Homepage_Logo.svg?demo=post-${index}`,uploadedAt:'2026-01-01T00:00:00.000Z',position:0,isFirstImage:1,post:{postId:post.postId}}));
    }
    await manager.getRepository(Attachment).save({imageUrl:'/Homepage_Logo.svg?demo=team',position:0,uploadedAt:'2026-01-01T00:00:00.000Z',team:{teamId:createdTeam.teamId}});
    return {created:true,campaignId:createdCampaign.campaignId,teamId:createdTeam.teamId};
  });
}
