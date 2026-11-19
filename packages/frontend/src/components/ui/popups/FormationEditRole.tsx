import Dialog from "@/components/ui/Dialog";
interface Props {
  onClose?: () => void;
}

export default function FormationEditRole({ onClose }: Props) {
  return (
      <Dialog title="Chỉnh sửa ban chỉ huy" onClose={onClose} className="w-[320px] rounded-xl  bg-[#F6D57A]">
        {/* Avatar */}
        <div className="flex justify-center items-center py-8">
          <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center">
            <svg aria-hidden="true"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="black"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c2-4 14-4 16 0" />
            </svg>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-white/60" />

        {/* Fields */}
        <div className="px-6 py-5 space-y-4 text-center">
          <label htmlFor="commander-role" className="block text-sm">Chức vụ</label>
          <input id="commander-role" autoComplete="organization-title"
            placeholder="Chức vụ"
            className="w-full text-center bg-transparent font-bold outline-none placeholder-gray-600"
          />

          <label htmlFor="commander-name" className="block text-sm">Họ và tên</label>
          <input id="commander-name" autoComplete="name"
            placeholder="Họ và tên"
            className="w-full text-center bg-transparent font-bold outline-none placeholder-gray-600"
          />
        </div>

        {/* Action */}
        <div className="pb-5 flex justify-center">
          <button onClick={onClose} className="px-4 py-2 underline text-sm text-black">Hủy</button>
          <button
            onClick={onClose}
            className="bg-[#F4B400] text-black font-bold text-sm px-6 py-2 rounded-md"
          >
            Hoàn tất
          </button>
        </div>
      </Dialog>
  );
}
