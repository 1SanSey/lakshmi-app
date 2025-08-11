import { useQuery } from "@tanstack/react-query";
import { Plus, Minus } from "lucide-react";
import type { Receipt, Cost } from "@shared/schema";

interface RecentActivity {
  recentReceipts: (Receipt & { sponsorName?: string })[];
  recentCosts: Cost[];
}

export default function RecentActivity() {
  const { data: activity, isLoading } = useQuery<RecentActivity>({
    queryKey: ["/api/dashboard/activity"],
    retry: false,
  });

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(parseFloat(amount));
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="financial-card animate-pulse">
            <div className="h-40 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="financial-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Недавние поступления</h3>
        <div className="space-y-3">
          {(!activity?.recentReceipts || activity.recentReceipts.length === 0) ? (
            <p className="text-muted-foreground text-sm">Нет недавних поступлений</p>
          ) : (
            activity.recentReceipts.map((receipt: any) => (
              <div key={receipt.id} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Plus className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{receipt.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {receipt.sponsorName ? `От ${receipt.sponsorName}` : "Прямое"}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-secondary">
                  +{formatCurrency(receipt.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="financial-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Недавние расходы</h3>
        <div className="space-y-3">
          {(!activity?.recentCosts || activity.recentCosts.length === 0) ? (
            <p className="text-muted-foreground text-sm">Нет недавних расходов</p>
          ) : (
            activity.recentCosts.map((cost: any) => (
              <div key={cost.id} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <Minus className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{cost.description}</p>
                    <p className="text-sm text-muted-foreground">{cost.category}</p>
                  </div>
                </div>
                <span className="font-semibold text-destructive">
                  -{formatCurrency(cost.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
