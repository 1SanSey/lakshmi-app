import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Calculator, AlertCircle, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Fund, Receipt, IncomeSourceFundDistribution, IncomeSource } from "@shared/schema";

interface FundDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DistributionPreview {
  fundId: string;
  fundName: string;
  percentage: number;
  amount: number;
}

export default function FundDistributionModal({ isOpen, onClose }: FundDistributionModalProps) {
  const [distributionPreviews, setDistributionPreviews] = useState<DistributionPreview[]>([]);
  const [totalToDistribute, setTotalToDistribute] = useState<number>(0);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: funds = [] } = useQuery<Fund[]>({
    queryKey: ["/api/funds"],
  });

  const { data: receipts = [] } = useQuery<Receipt[]>({
    queryKey: ["/api/receipts"],
  });

  const { data: incomeSources = [] } = useQuery<IncomeSource[]>({
    queryKey: ["/api/income-sources"],
  });

  const { data: unallocatedData } = useQuery<{ unallocatedAmount: number }>({
    queryKey: ["/api/unallocated-funds"],
  });

  const distributeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/distribute-unallocated-funds", "POST");
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Средства распределены по фондам",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/manual-fund-distributions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/unallocated-funds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/funds-with-balances"] });
      queryClient.invalidateQueries({ queryKey: ["/api/distribution-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      handleClose();
    },
    onError: (error) => {
      console.error("Error distributing funds:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось распределить средства",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setDistributionPreviews([]);
    setTotalToDistribute(0);
    onClose();
  };

  // Calculate distribution preview when modal opens
  useEffect(() => {
    if (isOpen && unallocatedData?.unallocatedAmount && unallocatedData.unallocatedAmount > 0) {
      calculateDistributionPreview();
    }
  }, [isOpen, unallocatedData]);

  const calculateDistributionPreview = async () => {
    // Если есть нераспределенные средства, показываем возможность распределения
    if (!unallocatedData?.unallocatedAmount || unallocatedData.unallocatedAmount <= 0) {
      setDistributionPreviews([]);
      setTotalToDistribute(0);
      return;
    }

    // Создаем превью для автоматического распределения нераспределенных средств
    const previews: DistributionPreview[] = [];
    const totalAmount = unallocatedData.unallocatedAmount;

    // Получаем все поступления без распределений и их источники доходов
    const undistributedReceipts = receipts.filter(receipt => receipt.incomeSourceId);
    
    if (undistributedReceipts.length > 0) {
      const fundDistributionMap = new Map<string, { percentage: number; amount: number }>();

      // Рассчитываем распределение для каждого поступления
      for (const receipt of undistributedReceipts) {
        if (!receipt.incomeSourceId) continue;

        const receiptAmount = parseFloat(receipt.amount);

        // Получаем настройки распределения для источника дохода
        try {
          const response = await apiRequest(`/api/income-sources/${receipt.incomeSourceId}/fund-distributions`, "GET");
          const distributions = await response.json() as IncomeSourceFundDistribution[];
          
          for (const distribution of distributions) {
            const distributionAmount = (receiptAmount * parseFloat(distribution.percentage)) / 100;
            
            if (fundDistributionMap.has(distribution.fundId)) {
              const existing = fundDistributionMap.get(distribution.fundId)!;
              existing.amount += distributionAmount;
            } else {
              fundDistributionMap.set(distribution.fundId, {
                percentage: parseFloat(distribution.percentage),
                amount: distributionAmount
              });
            }
          }
        } catch (error) {
          console.error("Error fetching fund distributions:", error);
        }
      }

      // Конвертируем в формат для отображения
      fundDistributionMap.forEach((data, fundId) => {
        const fund = funds.find(f => f.id === fundId);
        if (fund) {
          previews.push({
            fundId,
            fundName: fund.name,
            percentage: Math.round((data.amount / totalAmount) * 100 * 100) / 100,
            amount: data.amount
          });
        }
      });
    }

    // Если нет настроек распределения, показываем что средства готовы к ручному распределению
    if (previews.length === 0) {
      previews.push({
        fundId: "manual",
        fundName: "Требует ручного распределения",
        percentage: 100,
        amount: totalAmount
      });
    }

    setDistributionPreviews(previews);
    setTotalToDistribute(totalAmount);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(amount);
  };

  const handleDistribute = () => {
    distributeMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Распределение по фондам</span>
          </DialogTitle>
        </DialogHeader>

        {/* Unallocated Funds Info */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Нераспределённые средства:
                </span>
              </div>
              <span className="font-bold text-blue-900 dark:text-blue-100">
                {formatCurrency(unallocatedData?.unallocatedAmount || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Distribution Preview */}
        {distributionPreviews.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Предварительный расчёт распределения</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Фонд</TableHead>
                    <TableHead className="text-right">Процент</TableHead>
                    <TableHead className="text-right">Сумма</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributionPreviews.map((preview) => (
                    <TableRow key={preview.fundId}>
                      <TableCell className="font-medium">{preview.fundName}</TableCell>
                      <TableCell className="text-right">{preview.percentage.toFixed(2)}%</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(preview.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Итого:</span>
                  <span>{formatCurrency(totalToDistribute)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Нет нераспределённых поступлений для автоматического распределения
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleClose}>
            Отмена
          </Button>
          <Button 
            onClick={handleDistribute}
            disabled={distributeMutation.isPending || distributionPreviews.length === 0}
            className="bg-primary hover:bg-primary/90"
          >
            {distributeMutation.isPending ? "Распределение..." : "Распределить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}