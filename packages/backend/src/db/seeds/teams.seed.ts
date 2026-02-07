import { DataSource } from "typeorm";
import { Campaign } from "../../entities/Campaign.js";
import { Team } from "../../entities/Team.js";
import { Account } from "../../entities/Account.js";
import { User } from "../../entities/User.js";
import { Attachment } from "../../entities/Attachment.js";
import { RoleEnum } from "@uit-volunteer-map/shared";
import bcrypt from "bcrypt";

/**
 * Seeds campaign, teams, leader/viceleader accounts+users, and attachments.
 * Based on the mock data from the frontend.
 */
export const seedTeams = async (dataSource: DataSource) => {
  const campaignRepo = dataSource.getRepository(Campaign);
  const teamRepo = dataSource.getRepository(Team);
  const accountRepo = dataSource.getRepository(Account);
  const userRepo = dataSource.getRepository(User);
  const attachmentRepo = dataSource.getRepository(Attachment);

  // ============================================
  // 1. Seed Campaign
  // ============================================
  let campaign = await campaignRepo.findOneBy({
    campaignName: "Xuân Tình Nguyện 2026",
  });
  if (!campaign) {
    campaign = await campaignRepo.save(
      campaignRepo.create({
        campaignName: "Xuân Tình Nguyện 2026",
        startDate: "2026-01-17",
        endDate: "2026-02-07",
        description:
          "Chiến dịch Xuân Tình Nguyện – Trường Đại học Công nghệ Thông tin, ĐHQG-HCM là hoạt động tình nguyện ý nghĩa được tổ chức thường niên với sự tham gia của hàng trăm sinh viên thuộc nhiều đội hình khác nhau, với sứ mệnh mang không khí và hơi ấm ngày Tết đến với những hoàn cảnh, địa phương còn khó khăn.",
      }),
    );
    console.log("✓ Created campaign: Xuân Tình Nguyện 2026");
  }

  // ============================================
  // 2. Team data with leaders, vice leaders, and images
  // ============================================
  const teamsData = [
    {
      teamName: "Đội hình Truyền Thông",
      description: "Đội hình phụ trách truyền thông chiến dịch.",
      leader: {
        name: "Phan Thị Kim Ngân",
        avatar:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/truyenthong_lz7uhf.jpg",
      },
      viceLeaders: [
        {
          name: "Hà Yến Linh",
          avatar:
            "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/truyenthong_lz7uhf.jpg",
        },
      ],
      images: [
        "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/truyenthong_lz7uhf.jpg",
      ],
    },
    {
      teamName: "Đội hình Sự Kiện",
      description: "Đội hình tổ chức các sự kiện lớn nhỏ trong chiến dịch.",
      leader: {
        name: "Phan Mạnh Tân",
        avatar:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/sukien_t4ogv8.jpg",
      },
      viceLeaders: [
        {
          name: "Nguyễn Vũ Phúc",
          avatar:
            "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/sukien_t4ogv8.jpg",
        },
        {
          name: "Hoàng Xuân Minh Trí",
          avatar:
            "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/sukien_t4ogv8.jpg",
        },
      ],
      images: [
        "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/sukien_t4ogv8.jpg",
      ],
    },
    {
      teamName: "Đội hình Nhịp Xuân",
      description: "Đội hình mang không khí xuân đến mọi nơi.",
      leader: {
        name: "Đỗ Lê Tuấn Kiệt",
        avatar:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283326/nhipxuan_er4fy5.jpg",
      },
      viceLeaders: [
        {
          name: "Trần Nguyên Ngọc Thảo",
          avatar:
            "https://res.cloudinary.com/duallvqjh/image/upload/v1770283326/nhipxuan_er4fy5.jpg",
        },
        {
          name: "Lê Huyền Trân",
          avatar:
            "https://res.cloudinary.com/duallvqjh/image/upload/v1770283326/nhipxuan_er4fy5.jpg",
        },
      ],
      images: [
        "https://res.cloudinary.com/duallvqjh/image/upload/v1770283326/nhipxuan_er4fy5.jpg",
      ],
    },
    {
      teamName: "Đội hình Vì Đàn Em",
      description: "Đội hình hỗ trợ trẻ em và các hoạt động giáo dục.",
      leader: {
        name: "Lê Nguyễn Hoàng Anh",
        avatar:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283329/vidanem_ey0abn.jpg",
      },
      viceLeaders: [
        {
          name: "Nguyễn Nhất Anh",
          avatar:
            "https://res.cloudinary.com/duallvqjh/image/upload/v1770283329/vidanem_ey0abn.jpg",
        },
        {
          name: "Lâm Ngọc Quang Phúc",
          avatar:
            "https://res.cloudinary.com/duallvqjh/image/upload/v1770283329/vidanem_ey0abn.jpg",
        },
      ],
      images: [
        "https://res.cloudinary.com/duallvqjh/image/upload/v1770283329/vidanem_ey0abn.jpg",
      ],
    },
    {
      teamName: "Đội hình Xuân Công Nghệ",
      description: "Đội hình ứng dụng công nghệ trong chiến dịch.",
      leader: {
        name: "Nguyễn Hữu Minh Chiến",
        avatar:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283329/xuancongnghe_cccts3.jpg",
      },
      viceLeaders: [
        {
          name: "Nguyễn Đỗ Nhật Khuyên",
          avatar:
            "https://res.cloudinary.com/duallvqjh/image/upload/v1770283329/xuancongnghe_cccts3.jpg",
        },
        {
          name: "Đàm Duy Vũ",
          avatar:
            "https://res.cloudinary.com/duallvqjh/image/upload/v1770283329/xuancongnghe_cccts3.jpg",
        },
      ],
      images: [
        "https://res.cloudinary.com/duallvqjh/image/upload/v1770283329/xuancongnghe_cccts3.jpg",
      ],
    },
    {
      teamName: "Đội hình Văn Nghệ Xung Kích",
      description: "Đội hình tổ chức các hoạt động văn nghệ.",
      leader: {
        name: "Trần Thị Phương Viên",
        avatar:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/vannghexungkich_kkdmah.jpg",
      },
      viceLeaders: [
        {
          name: "Đỗ Trí Viên",
          avatar:
            "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/vannghexungkich_kkdmah.jpg",
        },
      ],
      images: [
        "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/vannghexungkich_kkdmah.jpg",
      ],
    },
    {
      teamName: "Đội hình Vị Xuân",
      description: "Đội hình mang hương vị xuân đến mọi nhà.",
      leader: {
        name: "Lê Diễm Quỳnh Như",
        avatar:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283328/vixuan_fmsk7k.jpg",
      },
      viceLeaders: [
        {
          name: "Lê Phong Phú",
          avatar:
            "https://res.cloudinary.com/duallvqjh/image/upload/v1770283328/vixuan_fmsk7k.jpg",
        },
        {
          name: "Trương Tấn Phát",
          avatar:
            "https://res.cloudinary.com/duallvqjh/image/upload/v1770283328/vixuan_fmsk7k.jpg",
        },
      ],
      images: [
        "https://res.cloudinary.com/duallvqjh/image/upload/v1770283328/vixuan_fmsk7k.jpg",
      ],
    },
    {
      teamName: "Đội hình Máy Tính Cũ - Tri Thức Mới",
      description: "Đội hình hỗ trợ công nghệ và tri thức mới.",
      leader: {
        name: "Lê Đức Nhân",
        avatar:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/maytinhcu_vrgfzz.jpg",
      },
      viceLeaders: [
        {
          name: "Võ Ngọc Quỳnh Hương",
          avatar:
            "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/maytinhcu_vrgfzz.jpg",
        },
        {
          name: "Cao Đăng Khôi",
          avatar:
            "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/maytinhcu_vrgfzz.jpg",
        },
      ],
      images: [
        "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/maytinhcu_vrgfzz.jpg",
      ],
    },
    {
      teamName: "Đội hình Gu Xuân",
      description: "Đội hình sáng tạo và đổi mới.",
      leader: {
        name: "Nguyễn Quốc Hải",
        avatar:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283330/guxuan_wkq96l.jpg",
      },
      viceLeaders: [
        {
          name: "Hoàng Khôi Nguyên",
          avatar:
            "https://res.cloudinary.com/duallvqjh/image/upload/v1770283330/guxuan_wkq96l.jpg",
        },
      ],
      images: [
        "https://res.cloudinary.com/duallvqjh/image/upload/v1770283330/guxuan_wkq96l.jpg",
      ],
    },
  ];

  // ============================================
  // 3. Helper: create account + user
  // ============================================
  const hashedPassword = await bcrypt.hash("password123", 10);
  let userCounter = 0;

  const createAccountAndUser = async (
    fullName: string,
    avatarUrl: string,
    roleId: number,
    team: Team,
  ): Promise<User> => {
    userCounter++;
    const username = `user_${fullName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/\s+/g, "_")
      .toLowerCase()}_${userCounter}`;

    // Check if user already exists in this team with this name
    const existingUser = await userRepo.findOne({
      where: { fullName, team: { teamId: team.teamId } },
    });
    if (existingUser) return existingUser;

    const account = await accountRepo.save(
      accountRepo.create({
        username,
        password: hashedPassword,
        roleId,
        createdAt: new Date().toISOString(),
        isDeleted: false,
      }),
    );

    const user = await userRepo.save(
      userRepo.create({
        fullName,
        avatarUrl,
        email: `${username}@gm.uit.edu.vn`,
        team,
        account,
        isDeleted: 0,
      }),
    );

    return user;
  };

  // ============================================
  // 4. Create teams with all related data
  // ============================================
  for (const teamData of teamsData) {
    // Check if team already exists
    let team = await teamRepo.findOneBy({ teamName: teamData.teamName });
    if (team) {
      console.log(`⊘ Team already exists: ${teamData.teamName}`);
      continue;
    }

    // Create team (without leader initially)
    team = await teamRepo.save(
      teamRepo.create({
        teamName: teamData.teamName,
        description: teamData.description,
        campaign: campaign,
        isDeleted: 0,
      }),
    );

    // Create leader account + user
    const leaderUser = await createAccountAndUser(
      teamData.leader.name,
      teamData.leader.avatar,
      2, // roleId 2 = LEADER
      team,
    );

    // Set the leader relation on team
    team.leader = leaderUser;
    await teamRepo.save(team);

    // Create vice leader accounts + users
    for (const vice of teamData.viceLeaders) {
      await createAccountAndUser(
        vice.name,
        vice.avatar,
        3, // roleId 3 = VICELEADER
        team,
      );
    }

    // Create attachments (images)
    for (let i = 0; i < teamData.images.length; i++) {
      await attachmentRepo.save(
        attachmentRepo.create({
          imageUrl: teamData.images[i],
          uploadedAt: new Date().toISOString(),
          position: i,
          team: team,
        }),
      );
    }

    console.log(`✓ Created team: ${teamData.teamName}`);
  }

  console.log("Teams seeded successfully!");
};
