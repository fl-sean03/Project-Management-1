'use client';

import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// A component that uses search params - wrapped in Suspense
function NotFoundContent() {
  // Explicitly use the search params hook to address the error
  const searchParams = useSearchParams();

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8">Page not found</p>
      <Link href="/">
        <Button className="bg-primary-blue hover:bg-primary-blue/90">
          Go Home
        </Button>
      </Link>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotFoundContent />
    </Suspense>
  );
} 