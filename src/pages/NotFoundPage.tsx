import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
      <div className="text-center">
        <p className="text-8xl md:text-9xl font-bold text-primary-600 dark:text-primary-500">
          404
        </p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
          Page Not Found
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="inline-block mt-6">
          <Button size="lg">
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
