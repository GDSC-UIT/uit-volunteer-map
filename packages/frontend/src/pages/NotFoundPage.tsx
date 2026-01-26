import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <p className="text-gray-600 mb-4">Page not found</p>
        <Link to="/" className="text-primary-600 hover:underline">
          Go home
        </Link>
      </div>
    </div>
  );
}
