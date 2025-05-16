'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Suspense } from 'react';

function NotFoundContent() {
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
    <Suspense fallback={
      <div className="h-screen w-full flex flex-col items-center justify-center">
        <p>Loading...</p>
      </div>
    }>
      <NotFoundContent />
    </Suspense>
  );
} 