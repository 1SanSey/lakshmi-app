import { useQuery } from "@tanstack/react-query";
import { PiggyBank } from "lucide-react";
import type { Fund } from "@shared/schema";

interface FundBalance {
  id: string;
  name: string;
  balance: number;
}

export default function FundBalances() {
  const { data: fundBalances, isLoading } = useQuery<FundBalance[]>({
    queryKey: ["/api/funds/balances"],
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
      <div className="financial-card animate-pulse">
        <div className="h-40 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="financial-card">
      <h3 className="text-lg font-semibold text-foreground mb-4">Остатки по фондам</h3>
      <div className="space-y-3">
        {(!fundBalances || fundBalances.length === 0) ? (
          <p className="text-muted-foreground text-sm">Нет активных фондов</p>
        ) : (
          fundBalances.map((fund) => (
            <div key={fund.id} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                  <PiggyBank className="h-4 w-4 text-blue-800 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{fund.name}</p>
                  <p className="text-sm text-muted-foreground">Текущий остаток</p>
                </div>
              </div>
              <span className="font-semibold text-blue-800 dark:text-blue-400">
                {formatCurrency(fund.balance)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}