import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { IncomeSource, Fund } from "@shared/schema";
import { IncomeSourceModal } from "@/components/modals/income-source-modal";
import { IncomeSourceFundDistributionModal } from "@/components/modals/income-source-fund-distribution-modal";
import { useToast } from "@/hooks/use-toast";

function IncomeSources() {
  const [selectedIncomeSource, setSelectedIncomeSource] = useState<IncomeSource | null>(null);
  const [isIncomeSourceModalOpen, setIsIncomeSourceModalOpen] = useState(false);
  const [isDistributionModalOpen, setIsDistributionModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: incomeSources = [], isLoading } = useQuery({
    queryKey: ["/api/income-sources"],
  });

  const { data: funds = [] } = useQuery({
    queryKey: ["/api/funds"],
  });

  const deleteIncomeSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/income-sources/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/income-sources"] });
      toast({
        title: "Успешно",
        description: "Источник поступления удален",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить источник поступления",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (incomeSource: IncomeSource) => {
    setSelectedIncomeSource(incomeSource);
    setIsIncomeSourceModalOpen(true);
  };

  const handleDelete = (incomeSource: IncomeSource) => {
    if (confirm(`Вы уверены, что хотите удалить источник "${incomeSource.name}"?`)) {
      deleteIncomeSourceMutation.mutate(incomeSource.id);
    }
  };

  const handleDistributionSettings = (incomeSource: IncomeSource) => {
    setSelectedIncomeSource(incomeSource);
    setIsDistributionModalOpen(true);
  };

  const closeIncomeSourceModal = () => {
    setSelectedIncomeSource(null);
    setIsIncomeSourceModalOpen(false);
  };

  const closeDistributionModal = () => {
    setSelectedIncomeSource(null);
    setIsDistributionModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Источники поступлений</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Загрузка источников...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Источники поступлений</h1>
          <p className="text-muted-foreground">
            Управление источниками поступлений и их распределением по фондам
          </p>
        </div>
        <Button onClick={() => setIsIncomeSourceModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить источник
        </Button>
      </div>

      {incomeSources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Нет источников поступлений</h3>
              <p className="text-muted-foreground mb-4">
                Создайте первый источник поступления для управления входящими средствами
              </p>
              <Button onClick={() => setIsIncomeSourceModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить источник
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {incomeSources.map((incomeSource: IncomeSource) => (
            <Card key={incomeSource.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{incomeSource.name}</CardTitle>
                  <Badge variant={incomeSource.isActive ? "default" : "secondary"}>
                    {incomeSource.isActive ? "Активен" : "Неактивен"}
                  </Badge>
                </div>
                {incomeSource.description && (
                  <CardDescription>{incomeSource.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(incomeSource)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDistributionSettings(incomeSource)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(incomeSource)}
                      disabled={deleteIncomeSourceMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <IncomeSourceModal
        incomeSource={selectedIncomeSource}
        isOpen={isIncomeSourceModalOpen}
        onClose={closeIncomeSourceModal}
      />

      <IncomeSourceFundDistributionModal
        incomeSource={selectedIncomeSource}
        funds={funds}
        isOpen={isDistributionModalOpen}
        onClose={closeDistributionModal}
      />
    </div>
  );
}

export default IncomeSources;