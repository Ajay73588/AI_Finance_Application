"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, LayoutDashboard, PenBox, Target } from "lucide-react";

import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    variant: "outline",
  },
  {
    href: "/portfolio",
    label: "Portfolio",
    icon: Briefcase,
    variant: "outline",
  },
  {
    href: "/dashboard/assets",
    label: "Assets",
    icon: Briefcase,
    variant: "outline",
  },
  {
    href: "/goals",
    label: "Goals",
    icon: Target,
    variant: "outline",
  },
  {
    href: "/transaction/create",
    label: "Add Transaction",
    icon: PenBox,
    variant: "default",
  },
];

function isActiveRoute(pathname, href) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = isActiveRoute(pathname, item.href);

        return (
          <Button
            key={item.href}
            asChild
            variant={isActive ? "default" : item.variant}
            className={cn(
              "flex items-center gap-2",
              isActive &&
                "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
            )}
          >
            <Link href={item.href}>
              <Icon size={18} />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
