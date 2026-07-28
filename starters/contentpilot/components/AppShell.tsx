"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navigation = [
  { href: "/", label: "Bắt đầu" },
  { href: "/setup", label: "Thiết lập" },
  { href: "/workflow", label: "Workflow" },
  { href: "/review", label: "Duyệt bài" },
];

function isCurrentPath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Về trang bắt đầu">
          <span className="wordmark-mark" aria-hidden="true">
            C
          </span>
          <span>ContentPilot</span>
        </Link>

        <nav className="primary-nav" aria-label="Điều hướng chính">
          {navigation.map((item) => {
            const isCurrent = isCurrentPath(pathname, item.href);

            return (
              <Link
                className="nav-item"
                href={item.href}
                key={item.href}
                aria-current={isCurrent ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="page-frame">{children}</div>
    </div>
  );
}
