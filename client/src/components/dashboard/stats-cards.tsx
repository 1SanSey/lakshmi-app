import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, BarChart3, Handshake, PiggyBank } from "lucide-react";

interface DashboardStats {
  totalReceipts: number;
  totalCosts: number;
  netBalance: number;
  activeSponsors: number;
  activeFunds: number;
  totalFundPercentage: number;
}

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="stat-card animate-pulse">
            <div className="h-20 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Общие поступления",
      value: formatCurrency(stats?.totalReceipts || 0),
      icon: TrendingUp,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Общие расходы",
      value: formatCurrency(stats?.totalCosts || 0),
      icon: TrendingDown,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Чистый баланс",
      value: formatCurrency(stats?.netBalance || 0),
      icon: BarChart3,
      color: (stats?.netBalance || 0) >= 0 ? "text-secondary" : "text-destructive",
      bgColor: "bg-primary/10",
    },
    {
      title: "Активные спонсоры",
      value: stats?.activeSponsors?.toString() || "0",
      icon: Handshake,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Активные фонды",
      value: `${stats?.activeFunds || 0} (${(stats?.totalFundPercentage || 0).toFixed(1)}%)`,
      icon: PiggyBank,
      color: (stats?.totalFundPercentage || 0) === 100 ? "text-secondary" : 
             (stats?.totalFundPercentage || 0) > 100 ? "text-destructive" : "text-amber-600",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {cards.map((card, index) => (
        <div key={index} className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
            <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
