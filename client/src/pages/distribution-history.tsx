import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Eye, TrendingUp, Calculator } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DistributionHistoryItem {
  id: string;
  fundId: string;
  amount: string;
  percentage: string;
  fundName: string;
  createdAt: string;
}

interface DistributionHistory {
  id: string;
  userId: string;
  totalAmount: string;
  distributionDate: string;
  createdAt: string;
  items: DistributionHistoryItem[];
}

export default function DistributionHistoryPage() {
  const [selectedDistribution, setSelectedDistribution] = useState<DistributionHistory | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { data: distributionHistory = [], isLoading } = useQuery<DistributionHistory[]>({
    queryKey: ["/api/distribution-history"],
  });

  const handleViewDetails = (distribution: DistributionHistory) => {
    setSelectedDistribution(distribution);
    setIsDetailModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: string) => {
    return Number(amount).toLocaleString('ru-RU') + ' ₽';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">История распределений</h1>
        </div>
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">История распределений</h1>
          <p className="text-muted-foreground">
            Просмотр всех выполненных распределений средств по фондам
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Всего записей: {distributionHistory.length}
        </Badge>
      </div>

      {distributionHistory.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">История пуста</h3>
            <p className="text-muted-foreground text-center">
              Распределения средств пока не выполнялись.
              <br />
              Создайте поступление и распределите средства по фондам.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {distributionHistory.map((distribution) => (
            <Card key={distribution.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {formatDate(distribution.distributionDate)}
                      </span>
                    </div>
                    <div className="text-2xl font-bold">
                      {formatAmount(distribution.totalAmount)}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {distribution.items.length} фонд{distribution.items.length === 1 ? '' : distribution.items.length < 5 ? 'а' : 'ов'}
                      </Badge>
                      {distribution.items.slice(0, 3).map((item) => (
                        <Badge key={item.id} variant="secondary" className="text-xs">
                          {item.fundName}: {formatAmount(item.amount)}
                        </Badge>
                      ))}
                      {distribution.items.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{distribution.items.length - 3} ещё
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(distribution)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Подробно
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Подробности распределения
            </DialogTitle>
          </DialogHeader>
          
          {selectedDistribution && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Дата распределения</p>
                  <p className="font-medium">{formatDate(selectedDistribution.distributionDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Общая сумма</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatAmount(selectedDistribution.totalAmount)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Распределение по фондам</h3>
                <div className="space-y-3">
                  {selectedDistribution.items.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.fundName}</p>
                          <p className="text-sm text-muted-foreground">
                            {Number(item.percentage).toFixed(1)}% от общей суммы
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">
                            {formatAmount(item.amount)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Распределение ID: {selectedDistribution.id}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}