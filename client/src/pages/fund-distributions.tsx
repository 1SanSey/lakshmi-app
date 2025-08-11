import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Calculator, Info, Eye, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FundDistributionModal from "@/components/modals/fund-distribution-modal";
import type { ManualFundDistribution, Fund } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

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

export default function FundDistributions() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState<DistributionHistory | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: distributions = [], isLoading: distributionsLoading } = useQuery<ManualFundDistribution[]>({
    queryKey: ["/api/manual-fund-distributions"],
  });

  const { data: funds = [] } = useQuery<Fund[]>({
    queryKey: ["/api/funds"],
  });

  const { data: unallocatedData } = useQuery<{ unallocatedAmount: number }>({
    queryKey: ["/api/unallocated-funds"],
  });

  const { data: distributionHistory = [], isLoading: historyLoading } = useQuery<DistributionHistory[]>({
    queryKey: ["/api/distribution-history"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/manual-fund-distributions/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Распределение удалено",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/manual-fund-distributions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/unallocated-funds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/funds-with-balances"] });
      queryClient.invalidateQueries({ queryKey: ["/api/distribution-history"] });
    },
    onError: (error) => {
      console.error("Error deleting manual fund distribution:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить распределение",
        variant: "destructive",
      });
    },
  });



  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(numAmount);
  };

  const getFundName = (fundId: string) => {
    const fund = funds.find(f => f.id === fundId);
    return fund?.name || "Неизвестный фонд";
  };

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

  if (distributionsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Распределение по фондам</h1>
          <p className="text-muted-foreground">Ручное распределение нераспределенных средств</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          disabled={!unallocatedData?.unallocatedAmount || unallocatedData.unallocatedAmount <= 0}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Создать распределение
        </Button>
      </div>

      {/* Unallocated Funds Info */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Нераспределенные средства
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Доступно для распределения по фондам
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {formatCurrency(unallocatedData?.unallocatedAmount || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distributions List */}
      <div className="space-y-4">
        {distributions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Нет распределений
              </h3>
              <p className="text-muted-foreground mb-4">
                Создайте первое распределение для управления нераспределенными средствами
              </p>
              <Button 
                onClick={() => setIsModalOpen(true)}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Создать распределение
              </Button>
            </CardContent>
          </Card>
        ) : (
          distributions.map((distribution) => (
            <Card key={distribution.id} className="financial-card">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {getFundName(distribution.fundId)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(distribution.date), 'd MMMM yyyy', { locale: ru })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {formatCurrency(distribution.amount)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(distribution.id)}
                      disabled={deleteMutation.isPending}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {distribution.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    {distribution.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* История распределений */}
      {distributionHistory.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">История распределений</h2>
            <Badge variant="outline" className="text-sm">
              {distributionHistory.length}
            </Badge>
          </div>
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

      <FundDistributionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}