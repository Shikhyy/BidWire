import Link from 'next/link';
import Background3D from '@/components/3d/Background3D';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Background3D variant="particles" />
      
      <div className="text-center max-w-md relative z-10">
        <h1 className="font-syne text-8xl font-bold text-dark mb-2">404</h1>
        <h2 className="font-syne text-2xl font-bold text-dark mb-4">Page not found</h2>
        <p className="text-slate mb-8">
          The page you're looking for doesn't exist.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-dark text-white font-syne rounded-full hover:bg-periwinkle hover:text-dark transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/auctions"
            className="px-6 py-3 border-2 border-dark text-dark font-syne rounded-full hover:bg-dark hover:text-white transition-colors"
          >
            View Auctions
          </Link>
        </div>
      </div>
    </div>
  );
}