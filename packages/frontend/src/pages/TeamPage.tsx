import { useParams, Link, useLocation } from "react-router";

export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const location = useLocation();

  const commanders = Array.from({ length: 3 });
  const activities = Array.from({ length: 8 });

  return (
    <div className="bg-[#D9D9D9] py-8">
      <section className="max-w-4xl mx-auto px-4">
        <h1 className="text-center text-3xl font-black mb-8">
          Tên đội hình {teamId}
        </h1>
      </section>

      <section className="max-w-4xl mx-auto px-4 mb-10">
        <div className="bg-[#E6E6E6] rounded-xl p-6 flex items-center justify-center">
          <div className="flex gap-6">
            <div className="w-24 h-24 bg-[#D9D9D9] flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-white rotate-45" />
            </div>
            <div className="w-32 h-32 bg-[#D9D9D9] flex items-center justify-center">
              <div className="w-14 h-14 border-2 border-white rotate-45" />
            </div>
            <div className="w-24 h-24 bg-[#D9D9D9] flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-white rotate-45" />
            </div>
          </div>
        </div>

        <div className="text-center mt-3 text-xs font-black text-gray-500">
          • • •
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 text-center mb-12">
        <p className="text-sm font-bold leading-relaxed text-black">
          Rhoncus morbi et augue nec, in id ullamcorper at. Condimentum sit nunc
          in eros scelerisque sed. Commodo in viverra nunc, ullamcorper ut.
          Aliquet scelerisque nullam sagittis, pulvinar. Fermentum scelerisque
          sit consectetur maecenas. Molestie eleifend ultrices purus lectus.
        </p>
      </section>


      <section className="max-w-4xl mx-auto px-4 mb-14">
        <h2 className="text-center font-black mb-6">Ban chỉ huy</h2>

        <div className="grid grid-cols-3 gap-8">
          {commanders.map((_, i) => (
            <div key={i} className="text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-[#E6E6E6] flex items-center justify-center mb-4">
                <div className="w-8 h-8 rounded-full bg-white/60" />
              </div>
              <div className="text-xs font-black">Chức vụ</div>
              <div className="text-xs font-bold text-gray-700">
                Họ và tên
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4">
        <h2 className="text-center font-black mb-6">Hoạt động</h2>

        <div className="grid grid-cols-4 gap-6">
          {activities.map((_, i) => (
            <Link
              key={i}
              to={`post/${i + 1}`}
              state={{ backgroundLocation: location }}
              className="bg-[#E6E6E6] aspect-square flex items-center justify-center rounded-md hover:scale-105 transition"
            >
              <div className="w-12 h-12 border-2 border-white rotate-45" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
