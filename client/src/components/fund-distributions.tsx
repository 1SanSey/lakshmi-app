import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PiggyBank } from "lucide-react";

interface FundDistribution {
  id: string;
  fundId: string;
  receiptId: string;
  amount: string;
  percentage: string;
  fundName: string;
  createdAt: string;
}

interface FundDistributionsProps {
  receiptId: string;
  receiptAmount: string;
}

export default function FundDistributions({ receiptId, receiptAmount }: FundDistributionsProps) {
  const { data: distributions = [], isLoading } = useQuery<FundDistribution[]>({
    queryKey: [`/api/receipts/${receiptId}/distributions`],
    retry: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5" />
            Fund Distributions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse text-muted-foreground">Loading distributions...</div>
        </CardContent>
      </Card>
    );
  }

  if (distributions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5" />
            Fund Distributions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">
            No fund distributions yet. Create funds to automatically distribute incoming receipts.
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalDistributed = distributions.reduce((sum, dist) => sum + parseFloat(dist.amount), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PiggyBank className="w-5 h-5" />
          Fund Distributions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {distributions.map((distribution) => (
          <div key={distribution.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-primary rounded-full" />
              <div>
                <div className="font-medium">{distribution.fundName}</div>
                <div className="text-sm text-muted-foreground">
                  {parseFloat(distribution.percentage).toFixed(2)}% allocation
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">
                {parseFloat(distribution.amount).toLocaleString('ru-RU')} ₽
              </div>
              <Badge variant="outline" className="text-xs">
                {parseFloat(distribution.percentage).toFixed(2)}%
              </Badge>
            </div>
          </div>
        ))}
        
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between font-medium">
            <span>Total Distributed</span>
            <span>{totalDistributed.toLocaleString('ru-RU')} ₽</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Receipt Amount</span>
            <span>{parseFloat(receiptAmount).toLocaleString('ru-RU')} ₽</span>
          </div>
          {totalDistributed !== parseFloat(receiptAmount) && (
            <div className="flex items-center justify-between text-sm text-amber-600 dark:text-amber-400">
              <span>Difference</span>
              <span>{(parseFloat(receiptAmount) - totalDistributed).toLocaleString('ru-RU')} ₽</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}