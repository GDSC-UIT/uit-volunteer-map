export interface TeamData {
  teamId: number;
  teamName: string;
  description: string;
  campaignId: number;
  leader: {
    name: string;
    avatarUrl: string;
  };
  vice: {
    name: string;
    avatarUrl: string;
  }[];
  images: string[];
}

export const mockTeams: TeamData[] = [
  {
    teamId: 1,
    teamName: "Đội hình Truyền Thông",
    description: "Đội hình phụ trách truyền thông chiến dịch.",
    campaignId: 1,
    leader: {
      name: "Phan Thị Kim Ngân",
      avatarUrl:
        "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/truyenthong_lz7uhf.jpg",
    },
    vice: [
      {
        name: "Hà Yến Linh",
        avatarUrl:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/truyenthong_lz7uhf.jpg",
      },
    ],
    images: [
      "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/truyenthong_lz7uhf.jpg",
    ],
  },
  {
    teamId: 2,
    teamName: "Đội hình Sự Kiện",
    description: "Đội hình tổ chức các sự kiện lớn nhỏ trong chiến dịch.",
    campaignId: 1,
    leader: {
      name: "Phan Mạnh Tân",
      avatarUrl:
        "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/sukien_t4ogv8.jpg",
    },
    vice: [
      {
        name: "Nguyễn Vũ Phúc",
        avatarUrl:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/sukien_t4ogv8.jpg",
      },
      {
        name: "Hoàng Xuân Minh Trí",
        avatarUrl:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/sukien_t4ogv8.jpg",
      },
    ],
    images: [
      "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/sukien_t4ogv8.jpg",
    ],
  },
  {
    teamId: 3,
    teamName: "Đội hình Nhịp Xuân",
    description: "Đội hình mang không khí xuân đến mọi nơi.",
    campaignId: 1,
    leader: {
      name: "Đỗ Lê Tuấn Kiệt",
      avatarUrl:
        "https://res.cloudinary.com/duallvqjh/image/upload/v1770283326/nhipxuan_er4fy5.jpg",
    },
    vice: [
      {
        name: "Trần Nguyên Ngọc Thảo",
        avatarUrl:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283326/nhipxuan_er4fy5.jpg",
      },
      {
        name: "Lê Huyền Trân",
        avatarUrl:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283326/nhipxuan_er4fy5.jpg",
      },
    ],
    images: [
      "https://res.cloudinary.com/duallvqjh/image/upload/v1770283326/nhipxuan_er4fy5.jpg",
    ],
  },
  {
    teamId: 4,
    teamName: "Đội hình Vì Đàn Em",
    description: "Đội hình hỗ trợ trẻ em và các hoạt động giáo dục.",
    campaignId: 1,
    leader: {
      name: "Lê Nguyễn Hoàng Anh",
      avatarUrl:
        "https://res.cloudinary.com/duallvqjh/image/upload/v1770283329/vidanem_ey0abn.jpg",
    },
    vice: [
      {
        name: "Nguyễn Nhất Anh",
        avatarUrl:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283329/vidanem_ey0abn.jpg",
      },
      {
        name: "Lâm Ngọc Quang Phúc",
        avatarUrl:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283329/vidanem_ey0abn.jpg",
      },
    ],
    images: [
      "https://res.cloudinary.com/duallvqjh/image/upload/v1770283329/vidanem_ey0abn.jpg",
    ],
  },
  {
    teamId: 5,
    teamName: "Đội hình Xuân Công Nghệ",
    description: "Đội hình ứng dụng công nghệ trong chiến dịch.",
    campaignId: 1,
    leader: {
      name: "Nguyễn Hữu Minh Chiến",
      avatarUrl:
        "https://res.cloudinary.com/duallvqjh/image/upload/v1770283329/xuancongnghe_cccts3.jpg",
    },
    vice: [
      {
        name: "Nguyễn Đỗ Nhật Khuyên",
        avatarUrl:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283329/xuancongnghe_cccts3.jpg",
      },
      {
        name: "Đàm Duy Vũ",
        avatarUrl:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283329/xuancongnghe_cccts3.jpg",
      },
    ],
    images: [
      "https://res.cloudinary.com/duallvqjh/image/upload/v1770283329/xuancongnghe_cccts3.jpg",
    ],
  },
  {
    teamId: 6,
    teamName: "Đội hình Văn Nghệ Xung Kích",
    description: "Đội hình tổ chức các hoạt động văn nghệ.",
    campaignId: 1,
    leader: {
      name: "Trần Thị Phương Viên",
      avatarUrl:
        "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/vannghexungkich_kkdmah.jpg",
    },
    vice: [
      {
        name: "Đỗ Trí Viên",
        avatarUrl:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/vannghexungkich_kkdmah.jpg",
      },
    ],
    images: [
      "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/vannghexungkich_kkdmah.jpg",
    ],
  },
  {
    teamId: 7,
    teamName: "Đội hình Vị Xuân",
    description: "Đội hình mang hương vị xuân đến mọi nhà.",
    campaignId: 1,
    leader: {
      name: "Lê Diễm Quỳnh Như",
      avatarUrl:
        "https://res.cloudinary.com/duallvqjh/image/upload/v1770283328/vixuan_fmsk7k.jpg",
    },
    vice: [
      {
        name: "Lê Phong Phú",
        avatarUrl:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283328/vixuan_fmsk7k.jpg",
      },
      {
        name: "Trương Tấn Phát",
        avatarUrl:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283328/vixuan_fmsk7k.jpg",
      },
    ],
    images: [
      "https://res.cloudinary.com/duallvqjh/image/upload/v1770283328/vixuan_fmsk7k.jpg",
    ],
  },
  {
    teamId: 8,
    teamName: "Đội hình Máy Tính Cũ - Tri Thức Mới",
    description: "Đội hình hỗ trợ công nghệ và tri thức mới.",
    campaignId: 1,
    leader: {
      name: "Lê Đức Nhân",
      avatarUrl:
        "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/maytinhcu_vrgfzz.jpg",
    },
    vice: [
      {
        name: "Võ Ngọc Quỳnh Hương",
        avatarUrl:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/maytinhcu_vrgfzz.jpg",
      },
      {
        name: "Cao Đăng Khôi",
        avatarUrl:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/maytinhcu_vrgfzz.jpg",
      },
    ],
    images: [
      "https://res.cloudinary.com/duallvqjh/image/upload/v1770283327/maytinhcu_vrgfzz.jpg",
    ],
  },
  {
    teamId: 9,
    teamName: "Đội hình Gu Xuân",
    description: "Đội hình sáng tạo và đổi mới.",
    campaignId: 1,
    leader: {
      name: "Nguyễn Quốc Hải",
      avatarUrl:
        "https://res.cloudinary.com/duallvqjh/image/upload/v1770283330/guxuan_wkq96l.jpg",
    },
    vice: [
      {
        name: "Hoàng Khôi Nguyên",
        avatarUrl:
          "https://res.cloudinary.com/duallvqjh/image/upload/v1770283330/guxuan_wkq96l.jpg",
      },
    ],
    images: [
      "https://res.cloudinary.com/duallvqjh/image/upload/v1770283330/guxuan_wkq96l.jpg",
    ],
  },
];
