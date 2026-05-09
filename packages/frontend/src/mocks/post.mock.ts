/* eslint-disable no-useless-escape*/
export interface PostData {
  postId: number;
  title: string;
  content: string;
  photos?: string[];
  teamId: number;
  createdAt: string;
  location: string;
}

export const mockPosts: PostData[] = [
  // Team 1 - Đội hình Truyền Thông (2 posts)
  {
    postId: 1,
    title: "Khởi đầu năm mới với chiến dịch truyền thông ý nghĩa",
    content: `📢 Đội hình Truyền Thông xin gửi lời chào đến toàn thể các bạn sinh viên UIT!\n\nNăm mới 2026, chúng mình đã sẵn sàng với hàng loạt hoạt động truyền thông sáng tạo để lan tỏa thông điệp yêu thương và tinh thần tình nguyện đến mọi người. 💚\n\nTrong tháng 1 vừa qua, team đã thực hiện:\n✨ 15+ bài viết truyền thông về các hoạt động tình nguyện\n✨ 3 video clip ngắn chia sẻ câu chuyện tình nguyện viên\n✨ Thiết kế hơn 20 poster cho các chiến dịch\n\nHãy theo dõi chúng mình để không bỏ lỡ những thông tin hữu ích về các hoạt động tình nguyện sắp tới nhé! 🌟\n\n#UITVolunteerMap #TruyenThong #ChaoXuan2026`,
    photos: [
      "https://picsum.photos/id/1015/800/800",
      "https://picsum.photos/id/1016/800/800",
    ],
    teamId: 1,
    createdAt: "2026-01-25T09:30:00Z",
    location: "TP. Hồ Chí Minh",
  },
  {
    postId: 2,
    title:
      "Behind the scenes - Đội ngũ Truyền Thông tại sự kiện Xuân Yêu Thương",
    content: `📸 Hậu trường của đội Truyền Thông luôn bận rộn nhưng vô cùng thú vị!\n\nCác bạn có biết, để có được những bức ảnh, video đẹp về các hoạt động tình nguyện, team mình đã phải:\n🎥 Thức khuya lên kịch bản, storyboard\n📷 Dậy sớm đi quay từ 5h sáng để bắt kịp ánh sáng đẹp\n💻 Edit hình, dựng video đến tận đêm khuya\n\nNhưng tất cả đều xứng đáng khi nhìn thấy những nụ cười rạng rỡ của các em nhỏ và sự cảm động của bà con khi nhận quà. Đó chính là động lực để chúng mình tiếp tục cố gắng! 💪❤️\n\nCảm ơn tất cả mọi người đã ủng hộ và theo dõi các hoạt động của UIT Volunteer Map!\n\n#BehindTheScenes #TruyenThong #TinhNguyen #UIT`,
    photos: [
      "https://picsum.photos/id/1018/800/800",
      "https://picsum.photos/id/1019/800/800",
      "https://picsum.photos/id/1020/800/800",
    ],
    teamId: 1,
    createdAt: "2026-02-05T14:20:00Z",
    location: "TP. Hồ Chí Minh",
  },

  // Team 2 - Đội hình Sự Kiện (1 post)
  {
    postId: 3,
    title: 'Tổng kết sự kiện "Xuân Yêu Thương 2026" - Thành công rực rỡ',
    content: `🎊 Đội hình Sự Kiện xin gửi lời cảm ơn chân thành đến toàn thể tình nguyện viên!\n\nSự kiện "Xuân Yêu Thương 2026" đã khép lại với những con số ấn tượng:\n🌟 500+ tình nguyện viên tham gia\n🌟 1,000+ phần quà được trao đến bà con\n🌟 15 hoạt động văn nghệ, sinh hoạt tập thể\n🌟 20+ gian hàng ẩm thực, thủ công mỹ nghệ\n\nĐội Sự Kiện đã làm việc không ngừng nghỉ trong suốt 2 tháng để mang đến một sự kiện hoàn hảo. Từ khâu lên kế hoạch, điều phối địa điểm, sắp xếp nhân sự cho đến giám sát thực hiện - tất cả đều được chuẩn bị tỉ mỉ.\n\nCảm ơn mọi người đã tin tưởng và đồng hành cùng chúng mình. Hẹn gặp lại ở những sự kiện tiếp theo! 🎉💚\n\n#SuKien #XuanYeuThuong #UIT #TinhNguyen`,
    photos: [
      "https://picsum.photos/id/1024/800/800",
      "https://picsum.photos/id/1025/800/800",
    ],
    teamId: 2,
    createdAt: "2026-02-03T16:45:00Z",
    location: "Quận Thủ Đức, TP. Hồ Chí Minh",
  },

  // Team 3 - Đội hình Nhịp Xuân (1 post)
  {
    postId: 4,
    title: "Nhịp Xuân rộn ràng - Mang Tết đến mọi miền",
    content: `🎆 Đội hình Nhịp Xuân chúc mừng năm mới 2026!\n\nĐược biết đến với sứ mệnh mang không khí Tết đến với mọi người, team Nhịp Xuân đã có một tháng Tết vô cùng bận rộn và ý nghĩa:\n\n🏮 Tổ chức 5 buổi gói bánh chưng tặng người nghèo\n🎨 Dạy vẽ tranh Đông Hồ cho trẻ em vùng cao\n🧧 Trao 300 phong bao lì xì may mắn\n🎭 Biểu diễn múa lân, ca hát tại 8 điểm\n\nNhịp Xuân không chỉ là âm thanh của trống trận, mà còn là tiếng cười rộn ràng, là ánh mắt hạnh phúc của các em nhỏ khi nhận quà. Đó là lý do team mình luôn cố gắng hết mình!\n\nCảm ơn tất cả các bạn tình nguyện viên đã đồng hành. Chúc mọi người năm mới an khang thịnh vượng! 🎊🧧\n\n#NhipXuan #TetYeuThuong #UIT #VolunteerMap`,
    photos: [
      "https://picsum.photos/id/1027/800/800",
      "https://picsum.photos/id/1028/800/800",
      "https://picsum.photos/id/1029/800/800",
    ],
    teamId: 3,
    createdAt: "2026-01-28T11:15:00Z",
    location: "Nhiều tỉnh thành",
  },

  // Team 5 - Đội hình Xuân Công Nghệ (3 posts)
  {
    postId: 5,
    title: "Ra mắt ứng dụng UIT Volunteer Map - Kết nối tình nguyện viên",
    content: `💻 Đội hình Xuân Công Nghệ tự hào giới thiệu ứng dụng UIT Volunteer Map!\n\nSau 6 tháng phát triển, chúng mình đã chính thức ra mắt nền tảng kết nối tình nguyện viên với các hoạt động thiện nguyện trên toàn quốc. 🚀\n\n✨ Tính năng nổi bật:\n📍 Bản đồ tương tác hiển thị các chiến dịch tình nguyện\n📱 Đăng ký tham gia chỉ với vài thao tác\n👥 Kết nối với cộng đồng tình nguyện viên\n📊 Theo dõi tiến độ và thành tích cá nhân\n🔔 Nhận thông báo về sự kiện mới\n\nỨng dụng có sẵn trên cả iOS và Android. Hãy tải ngay và trở thành một phần của cộng đồng UIT Volunteer nhé!\n\n#XuanCongNghe #TechForGood #UITVolunteerMap #Innovation`,
    photos: [
      "https://picsum.photos/id/1030/800/800",
      "https://picsum.photos/id/1031/800/800",
    ],
    teamId: 5,
    createdAt: "2026-01-20T10:00:00Z",
    location: "TP. Hồ Chí Minh",
  },
  {
    postId: 6,
    title: "Workshop: Ứng dụng AI trong hoạt động tình nguyện",
    content: `🤖 Đội Xuân Công Nghệ mời các bạn tham dự workshop đặc biệt!\n\nChủ đề: "AI và Machine Learning trong hoạt động tình nguyện"\n📅 Thời gian: 15/02/2026, 14:00 - 17:00\n📍 Địa điểm: Hội trường A, UIT\n\nNội dung workshop:\n🔹 Giới thiệu các ứng dụng AI trong lĩnh vực xã hội\n🔹 Case study: Dự đoán nhu cầu cứu trợ bằng ML\n🔹 Demo: Chatbot tư vấn hoạt động tình nguyện\n🔹 Thảo luận nhóm và brainstorming ý tưởng\n\nĐây là cơ hội tuyệt vời để các bạn yêu thích công nghệ học hỏi cách áp dụng kiến thức vào hoạt động cộng đồng. Số lượng có hạn, đăng ký ngay! 💡\n\nLink đăng ký: [bit.ly/uitvolunteer-ai-workshop]\n\n#AI #MachineLearning #TechWorkshop #UIT #VolunteerTech`,
    photos: ["https://picsum.photos/id/1032/800/800"],
    teamId: 5,
    createdAt: "2026-02-01T08:30:00Z",
    location: "Đại học CNTT, TP. Hồ Chí Minh",
  },
  {
    postId: 7,
    title: 'Dự án "Tech for Community" - Thắp sáng tương lai với công nghệ',
    content: `💡 Xuân Công Nghệ khởi động dự án \"Tech for Community\"!\n\nMục tiêu: Đào tạo miễn phí kỹ năng lập trình và công nghệ cho 200 học sinh vùng khó khăn.\n\n📚 Nội dung chương trình:\n- Lập trình cơ bản với Python\n- Thiết kế web HTML/CSS/JavaScript  \n- Tư duy logic và giải quyết vấn đề\n- Kỹ năng sử dụng máy tính văn phòng\n\n👩‍🏫 Đội ngũ giảng viên:\n- 15 sinh viên UIT giỏi các môn chuyên ngành\n- 3 mentor từ các công ty công nghệ\n- Tài liệu học tập được thiết kế đặc biệt\n\nThời gian: Mỗi tuần 2 buổi, kéo dài 3 tháng\nĐịa điểm: 5 trường THCS tại Long An, Bình Dương\n\nDự án không chỉ truyền đạt kiến thức mà còn là cầu nối giúp các em tiếp cận với công nghệ hiện đại. Ai biết đâu, trong số các em có những lập trình viên tài năng của tương lai! 🌟\n\n#TechForCommunity #GiaoDucCongNghe #UIT #TinhNguyen #CodingForKids`,
    photos: [
      "https://picsum.photos/id/1033/800/800",
      "https://picsum.photos/id/1034/800/800",
      "https://picsum.photos/id/1035/800/800",
    ],
    teamId: 5,
    createdAt: "2026-02-07T13:00:00Z",
    location: "Long An, Bình Dương",
  },
];
