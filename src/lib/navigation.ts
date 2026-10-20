"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

export function useLocation(): [string, (to: string) => void] {
  const pathname = usePathname();
  const router = useRouter();
  const navigate = useCallback(
    (to: string) => {
      router.push(to);
    },
    [router]
  );
  return [pathname || "/", navigate];
}

export { Link };
