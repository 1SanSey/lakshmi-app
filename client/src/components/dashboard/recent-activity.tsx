import { useQuery } from "@tanstack/react-query";
import { Plus, Minus, PiggyBank } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Receipt, Cost } from "@shared/schema";

interface RecentActivity {
  recentReceipts: (Receipt & { sponsorName?: string; incomeSourceName?: string })[];
  recentCosts: (Cost & { expenseNomenclatureName?: string; expenseCategoryName?: string })[];
}

interface FundBalance {
  id: string;
  name: string;
  balance: number;
}

export default function RecentActivity() {
  const { data: activity, isLoading } = useQuery<RecentActivity>({
    queryKey: ["/api/dashboard/activity"],
    retry: false,
  });

  const { data: fundBalances, isLoading: fundBalancesLoading } = useQuery<FundBalance[]>({
    queryKey: ["/api/funds-with-balances"],
    retry: false,
  });

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(parseFloat(amount));
  };

  if (isLoading || fundBalancesLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="financial-card animate-pulse">
            <div className="h-40 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="financial-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Недавние поступления</h3>
        <div className="space-y-3">
          {(!activity?.recentReceipts || activity.recentReceipts.length === 0) ? (
            <p className="text-muted-foreground text-sm">Нет недавних поступлений</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activity.recentReceipts.slice(0, 6).map((receipt: any) => (
                <div key={receipt.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Plus className="h-4 w-4 text-secondary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground text-sm break-words">
                        {receipt.incomeSourceName || receipt.description}
                      </p>
                      <p className="text-xs text-muted-foreground break-words">
                        {receipt.sponsorName ? `От ${receipt.sponsorName}` : (receipt.incomeSourceName ? "Источник" : "Прямое")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(receipt.date), "dd MMM", { locale: ru })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="font-semibold text-secondary text-sm whitespace-nowrap">
                      +{formatCurrency(receipt.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="financial-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Недавние расходы</h3>
        <div className="space-y-3">
          {(!activity?.recentCosts || activity.recentCosts.length === 0) ? (
            <p className="text-muted-foreground text-sm">Нет недавних расходов</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activity.recentCosts.slice(0, 6).map((cost: any) => (
                <div key={cost.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Minus className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground text-sm break-words">
                        {cost.expenseNomenclatureName || "Без номенклатуры"}
                      </p>
                      <p className="text-xs text-muted-foreground break-words">
                        {cost.expenseCategoryName || "Без категории"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(cost.date), "dd MMM", { locale: ru })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="font-semibold text-destructive text-sm whitespace-nowrap">
                      -{formatCurrency(cost.totalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="financial-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Остатки по фондам</h3>
        <div className="space-y-3">
          {(!fundBalances || fundBalances.length === 0) ? (
            <p className="text-muted-foreground text-sm">Нет активных фондов</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {fundBalances.map((fund) => (
                <div key={fund.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center flex-shrink-0">
                      <PiggyBank className="h-4 w-4 text-blue-800 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground text-sm break-words">{fund.name}</p>
                      <p className="text-xs text-muted-foreground">Текущий остаток</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="font-semibold text-blue-800 dark:text-blue-400 text-sm whitespace-nowrap">
                      {new Intl.NumberFormat('ru-RU', {
                        style: 'currency',
                        currency: 'RUB',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(parseFloat(fund.balance))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
