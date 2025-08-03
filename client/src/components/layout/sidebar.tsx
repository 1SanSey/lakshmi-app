import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { BarChart3, Handshake, Receipt, CreditCard, PiggyBank } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Sponsors", href: "/sponsors", icon: Handshake },
  { name: "Receipts", href: "/receipts", icon: Receipt },
  { name: "Costs", href: "/costs", icon: CreditCard },
  { name: "Funds", href: "/funds", icon: PiggyBank },
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
                <a
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors",
                    isActive
                      ? "nav-active"
                      : "nav-inactive"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
