import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { BarChart3, Handshake, Receipt, CreditCard, PiggyBank, TrendingUp, ArrowLeftRight } from "lucide-react";

const navigation = [
  { name: "Обзор", href: "/", icon: BarChart3 },
  { name: "Источники поступлений", href: "/income-sources", icon: TrendingUp },
  { name: "Спонсоры", href: "/sponsors", icon: Handshake },
  { name: "Поступления", href: "/receipts", icon: Receipt },
  { name: "Расходы", href: "/costs", icon: CreditCard },
  { name: "Фонды", href: "/funds", icon: PiggyBank },
  { name: "Переводы фондов", href: "/fund-transfers", icon: ArrowLeftRight },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-16 lg:z-30">
      <div className="flex flex-col flex-grow bg-card border-r border-border pt-5 pb-4 overflow-y-auto">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors cursor-pointer",
                    isActive
                      ? "nav-active"
                      : "nav-inactive"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
