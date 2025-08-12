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
  ChevronDown,
  ChevronRight
} from "lucide-react";

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

export default function Sidebar() {
  const [location] = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    // Автоматически разворачиваем секции с активными элементами
    const expanded: string[] = [];
    navigation.forEach(item => {
      if (item.children && item.children.some(child => location === child.href)) {
        expanded.push(item.name);
      }
    });
    return expanded;
  });

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    );
  };

  const isChildActive = (children: any[]) => {
    return children.some(child => location === child.href);
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-16 lg:z-30">
      <div className="flex flex-col flex-grow bg-card border-r border-border pt-5 pb-4 overflow-y-auto">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            if (item.children) {
              const isExpanded = expandedSections.includes(item.name);
              const hasActiveChild = isChildActive(item.children);
              
              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleSection(item.name)}
                    className={cn(
                      "group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md w-full transition-colors",
                      hasActiveChild ? "nav-active" : "nav-inactive"
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const isChildActive = location === child.href;
                        return (
                          <Link key={child.name} href={child.href}>
                            <div
                              className={cn(
                                "group flex items-center px-2 py-2 text-sm rounded-md w-full transition-colors cursor-pointer",
                                isChildActive
                                  ? "nav-active"
                                  : "nav-inactive"
                              )}
                            >
                              <child.icon className="mr-3 h-4 w-4" />
                              {child.name}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            } else {
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
            }
          })}
        </nav>
      </div>
    </aside>
  );
}
