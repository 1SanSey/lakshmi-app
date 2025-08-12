import { Link, useLocation } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Handshake, 
  Receipt, 
  CreditCard, 
  PiggyBank, 
  TrendingUp, 
  ArrowLeftRight, 
  Calculator, 
  FileText, 
  Tags, 
  FileBarChart,
  Menu,
  X
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const navigation = [
  { name: "Обзор", href: "/", icon: BarChart3 },
  {
    name: "Поступления",
    icon: Receipt,
    children: [
      { name: "Источники поступлений", href: "/income-sources", icon: TrendingUp },
      { name: "Поступления", href: "/receipts", icon: Receipt },
      { name: "Спонсоры", href: "/sponsors", icon: Handshake },
    ]
  },
  {
    name: "Расходы",
    icon: CreditCard,
    children: [
      { name: "Статьи расходов", href: "/expense-categories", icon: Tags },
      { name: "Номенклатура расходов", href: "/nomenclature", icon: FileText },
      { name: "Расходы", href: "/costs", icon: CreditCard },
    ]
  },
  {
    name: "Фонды",
    icon: PiggyBank,
    children: [
      { name: "Фонды", href: "/funds", icon: PiggyBank },
      { name: "Переводы фондов", href: "/fund-transfers", icon: ArrowLeftRight },
      { name: "Распределение фондов", href: "/fund-distributions", icon: Calculator },
    ]
  },
  { name: "Отчеты", href: "/reports", icon: FileBarChart },
];

export default function MobileNav() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isChildActive = (children: any[]) => {
    return children.some(child => location === child.href);
  };

  const mainItems = navigation.filter(item => item.href || item.children);
  const visibleItems = mainItems.slice(0, 4); // Показываем только первые 4 пункта
  const hasMoreItems = mainItems.length > 4;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      <nav className="flex justify-around py-2">
        {visibleItems.map((item) => {
          if (item.children) {
            const hasActiveChild = isChildActive(item.children);
            return (
              <Sheet key={item.name}>
                <SheetTrigger asChild>
                  <div
                    className={cn(
                      "flex flex-col items-center py-2 px-3 text-xs font-medium transition-colors cursor-pointer",
                      hasActiveChild ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 mb-1", hasActiveChild ? "text-primary" : "text-muted-foreground")} />
                    <span>{item.name}</span>
                  </div>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-auto">
                  <div className="py-4">
                    <h3 className="text-lg font-semibold mb-4">{item.name}</h3>
                    <div className="space-y-2">
                      {item.children.map((child) => {
                        const isChildActive = location === child.href;
                        return (
                          <Link key={child.name} href={child.href}>
                            <div
                              className={cn(
                                "flex items-center px-4 py-3 text-sm rounded-lg transition-colors cursor-pointer",
                                isChildActive
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted"
                              )}
                            >
                              <child.icon className="mr-3 h-5 w-5" />
                              {child.name}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            );
          } else {
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
          }
        })}

        {hasMoreItems && (
          <Sheet>
            <SheetTrigger asChild>
              <div className="flex flex-col items-center py-2 px-3 text-xs font-medium transition-colors cursor-pointer text-muted-foreground">
                <Menu className="h-5 w-5 mb-1" />
                <span>Еще</span>
              </div>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto">
              <div className="py-4">
                <h3 className="text-lg font-semibold mb-4">Все разделы</h3>
                <div className="space-y-2">
                  {mainItems.slice(4).map((item) => {
                    if (item.children) {
                      const hasActiveChild = isChildActive(item.children);
                      return (
                        <Collapsible key={item.name}>
                          <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-sm rounded-lg hover:bg-muted">
                            <div className="flex items-center">
                              <item.icon className="mr-3 h-5 w-5" />
                              {item.name}
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pl-8 space-y-1">
                            {item.children.map((child) => {
                              const isChildActive = location === child.href;
                              return (
                                <Link key={child.name} href={child.href}>
                                  <div
                                    className={cn(
                                      "flex items-center px-4 py-2 text-sm rounded-lg transition-colors cursor-pointer",
                                      isChildActive
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted"
                                    )}
                                  >
                                    <child.icon className="mr-3 h-4 w-4" />
                                    {child.name}
                                  </div>
                                </Link>
                              );
                            })}
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    } else {
                      const isActive = location === item.href;
                      return (
                        <Link key={item.name} href={item.href}>
                          <div
                            className={cn(
                              "flex items-center px-4 py-3 text-sm rounded-lg transition-colors cursor-pointer",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            )}
                          >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.name}
                          </div>
                        </Link>
                      );
                    }
                  })}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </nav>
    </div>
  );
}
