interface Props { postCount?: number; teamCount?: number; mappedCount?: number; }
export default function Statistic({ postCount, teamCount, mappedCount }: Props) {
  const stats = [
    { num: postCount, label: 'Bài đăng' },
    { num: teamCount, label: 'Đội hình' },
    { num: mappedCount, label: 'Điểm bài đăng' },
  ];
  return <dl aria-label="Thống kê chiến dịch" className="flex flex-col gap-2 w-full max-w-sm justify-center">
    {stats.map(item => <div key={item.label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-center gap-4">
      <dt className="stats-label col-start-2 row-start-1 text-2xl lg:text-[35px] uppercase min-w-0 wrap-anywhere">{item.label}</dt>
      <dd className="stats-number col-start-1 row-start-1 text-6xl lg:text-[80px] text-right tabular-nums wrap-anywhere">
        {item.num === undefined ? <><span aria-hidden="true">—</span><span className="sr-only">Chưa có số liệu</span></> : item.num}
      </dd>
    </div>)}
  </dl>;
}
