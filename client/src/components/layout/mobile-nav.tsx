import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { BarChart3, Handshake, Receipt, CreditCard, PiggyBank, TrendingUp, ArrowLeftRight } from "lucide-react";

const navigation = [
  { name: "Обзор", href: "/", icon: BarChart3 },
  { name: "Источники", href: "/income-sources", icon: TrendingUp },
  { name: "Спонсоры", href: "/sponsors", icon: Handshake },
  { name: "Поступления", href: "/receipts", icon: Receipt },
  { name: "Расходы", href: "/costs", icon: CreditCard },
  { name: "Фонды", href: "/funds", icon: PiggyBank },
  { name: "Переводы", href: "/fund-transfers", icon: ArrowLeftRight },
];

export default function MobileNav() {
  const [location] = useLocation();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      <nav className="flex justify-around py-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex flex-col items-center py-2 px-3 text-xs font-medium transition-colors cursor-pointer",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 mb-1", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
