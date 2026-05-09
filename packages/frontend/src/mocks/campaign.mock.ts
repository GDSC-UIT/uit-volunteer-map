export interface CampaignData {
    campaignId: number;
    campaignName: string;
    startDate: string;
    endDate: string;
    description: string;
}

export const mockCampaigns: CampaignData[] = [
    {
        campaignId: 1,
        campaignName: "Xuân Tình Nguyện 2026",
        startDate: "2026-01-17",
        endDate: "2026-02-07",
        description: "Chiến dịch tình nguyện mùa xuân nhằm mang lại niềm vui và sự ấm áp cho cộng đồng trong dịp Tết Nguyên Đán.",
    },
    {
        campaignId: 2,
        campaignName: "Mùa Hè Xanh 2026",
        startDate: "2026-06-01",
        endDate: "2026-08-31",
        description: "Chiến dịch tình nguyện mùa hè với các hoạt động hỗ trợ giáo dục, y tế và phát triển cộng đồng tại các vùng sâu vùng xa.",
    }
]