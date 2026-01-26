import { useParams, Link, useLocation } from "react-router";

export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const location = useLocation();
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4 text-black">Thông tin Đội hình {teamId}</h1>
      {/* Mock Team's posts */}
      <div className="mt-6">
        <h2 className="text-2xl font-semibold mb-3 text-black">Bài đăng của Đội hình</h2>
        <ul className="list-disc list-inside text-black">
          <li>
            <Link to={`post/1`} state={{ backgroundLocation: location }}>
              Bài đăng 1 của đội hình {teamId}
            </Link>
          </li>
          <li>
            <Link to={`post/2`} state={{ backgroundLocation: location }}>
              Bài đăng 2 của đội hình {teamId}
            </Link>
          </li>
          <li>
            <Link to={`post/3`} state={{ backgroundLocation: location }}>
              Bài đăng 3 của đội hình {teamId}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
