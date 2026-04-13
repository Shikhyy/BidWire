'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <h1 className="font-syne text-6xl font-bold text-dark mb-4">500</h1>
            <h2 className="font-syne text-2xl font-bold text-dark mb-2">Something went wrong</h2>
            <p className="text-slate mb-8">
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-dark text-white font-syne rounded-full hover:bg-periwinkle hover:text-dark transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}