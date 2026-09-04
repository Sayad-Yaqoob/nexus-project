'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FindPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/nexus');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0B1320] flex items-center justify-center text-[#00C49F]">
      Redirecting to NEXUS Agent Canvas...
    </div>
  );
}
