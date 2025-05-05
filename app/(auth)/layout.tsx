'use client';

import type React from "react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="flex h-14 items-center px-4 lg:px-6">
        <Link href="/" className="flex items-center gap-2">
          {!logoError ? (
            <Image
              src="/logo.svg"
              alt="Zyra Logo"
              width={32}
              height={32}
              className="h-6 w-6"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="h-6 w-6 bg-primary-blue rounded-full flex items-center justify-center text-white text-xs font-bold">
              Z
            </div>
          )}
          <span className="text-lg font-bold">Zyra</span>
        </Link>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="flex h-14 items-center border-t px-4 lg:px-6">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Zyra. All rights reserved.
        </p>
      </footer>
    </div>
  );
} 