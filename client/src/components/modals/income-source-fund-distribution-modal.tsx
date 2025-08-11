import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { type IncomeSource, type Fund, type IncomeSourceFundDistribution } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface IncomeSourceFundDistributionModalProps {
  incomeSource: IncomeSource | null;
  funds: Fund[];
  isOpen: boolean;
  onClose: () => void;
}

export function IncomeSourceFundDistributionModal({
  incomeSource,
  funds,
  isOpen,
  onClose,
}: IncomeSourceFundDistributionModalProps) {
  const [selectedFundId, setSelectedFundId] = useState<string>("");
  const [percentage, setPercentage] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: distributions = [], isLoading } = useQuery({
    queryKey: ["/api/income-sources", incomeSource?.id, "fund-distributions"],
    enabled: !!incomeSource?.id,
  });

  const createDistributionMutation = useMutation({
    mutationFn: async ({ fundId, percentage }: { fundId: string; percentage: string }) => {
      return await apiRequest(`/api/income-sources/${incomeSource!.id}/fund-distributions`, {
        method: "POST",
        body: JSON.stringify({ fundId, percentage }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/income-sources", incomeSource?.id, "fund-distributions"],
      });
      setSelectedFundId("");
      setPercentage("");
      toast({
        title: "Успешно",
        description: "Распределение добавлено",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить распределение",
        variant: "destructive",
      });
    },
  });

  const deleteAllDistributionsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/income-sources/${incomeSource!.id}/fund-distributions`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/income-sources", incomeSource?.id, "fund-distributions"],
      });
      toast({
        title: "Успешно",
        description: "Все распределения удалены",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить распределения",
        variant: "destructive",
      });
    },
  });

  const activeFunds = funds.filter(fund => fund.isActive);
  const usedFundIds = distributions.map((d: IncomeSourceFundDistribution & { fundName: string }) => d.fundId);
  const availableFunds = activeFunds.filter(fund => !usedFundIds.includes(fund.id));

  const totalPercentage = distributions.reduce(
    (sum: number, d: IncomeSourceFundDistribution & { fundName: string }) => sum + parseFloat(d.percentage),
    0
  );

  const handleAddDistribution = () => {
    if (!selectedFundId || !percentage) {
      toast({
        title: "Ошибка",
        description: "Выберите фонд и укажите процент",
        variant: "destructive",
      });
      return;
    }

    const percentageNum = parseFloat(percentage);
    if (percentageNum <= 0 || percentageNum > 100) {
      toast({
        title: "Ошибка",
        description: "Процент должен быть от 0.01 до 100",
        variant: "destructive",
      });
      return;
    }

    if (totalPercentage + percentageNum > 100) {
      toast({
        title: "Ошибка",
        description: `Общий процент не должен превышать 100%. Доступно: ${(100 - totalPercentage).toFixed(2)}%`,
        variant: "destructive",
      });
      return;
    }

    createDistributionMutation.mutate({
      fundId: selectedFundId,
      percentage,
    });
  };

  const handleDeleteAll = () => {
    if (confirm("Вы уверены, что хотите удалить все распределения?")) {
      deleteAllDistributionsMutation.mutate();
    }
  };

  if (!incomeSource) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            Распределение по фондам: {incomeSource.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current distributions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Текущие распределения</h3>
              {distributions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteAll}
                  disabled={deleteAllDistributionsMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить все
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : distributions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <p className="text-muted-foreground">Нет настроенных распределений</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {distributions.map((distribution: IncomeSourceFundDistribution & { fundName: string }) => (
                  <Card key={distribution.id}>
                    <CardContent className="flex items-center justify-between py-3">
                      <div>
                        <span className="font-medium">{distribution.fundName}</span>
                      </div>
                      <Badge variant="secondary">
                        {parseFloat(distribution.percentage).toFixed(2)}%
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
                <Card className="border-primary/20">
                  <CardContent className="flex items-center justify-between py-3">
                    <span className="font-semibold">Общий процент:</span>
                    <Badge variant={totalPercentage === 100 ? "default" : "secondary"}>
                      {totalPercentage.toFixed(2)}%
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Add new distribution */}
          {availableFunds.length > 0 && totalPercentage < 100 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Добавить распределение</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fund">Фонд</Label>
                  <Select value={selectedFundId} onValueChange={setSelectedFundId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите фонд" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFunds.map((fund) => (
                        <SelectItem key={fund.id} value={fund.id}>
                          {fund.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="percentage">
                    Процент (доступно: {(100 - totalPercentage).toFixed(2)}%)
                  </Label>
                  <Input
                    id="percentage"
                    type="number"
                    min="0.01"
                    max={100 - totalPercentage}
                    step="0.01"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <Button
                  onClick={handleAddDistribution}
                  disabled={!selectedFundId || !percentage || createDistributionMutation.isPending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {createDistributionMutation.isPending ? "Добавление..." : "Добавить распределение"}
                </Button>
              </div>
            </div>
          )}

          {availableFunds.length === 0 && totalPercentage < 100 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <p className="text-muted-foreground text-center">
                  Все активные фонды уже добавлены в распределение
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={onClose}>Закрыть</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}