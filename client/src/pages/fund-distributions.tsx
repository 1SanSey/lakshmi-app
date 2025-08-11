import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Calculator, Info } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import FundDistributionModal from "@/components/modals/fund-distribution-modal";
import type { ManualFundDistribution, Fund } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function FundDistributions() {
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/manual-fund-distributions/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Распределение удалено",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/manual-fund-distributions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/unallocated-funds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/funds-with-balances"] });
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

      <FundDistributionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}