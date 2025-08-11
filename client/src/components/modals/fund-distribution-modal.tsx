import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Calculator, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiRequest } from "@/lib/queryClient";
import type { Fund, InsertManualFundDistribution } from "@shared/schema";

interface FundDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FundDistributionModal({ isOpen, onClose }: FundDistributionModalProps) {
  const [selectedFundId, setSelectedFundId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: funds = [] } = useQuery<Fund[]>({
    queryKey: ["/api/funds"],
  });

  const { data: unallocatedData } = useQuery<{ unallocatedAmount: number }>({
    queryKey: ["/api/unallocated-funds"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertManualFundDistribution) => {
      return await apiRequest("/api/manual-fund-distributions", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Распределение создано",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/manual-fund-distributions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/unallocated-funds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/funds-with-balances"] });
      handleClose();
    },
    onError: (error) => {
      console.error("Error creating manual fund distribution:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать распределение",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setSelectedFundId("");
    setAmount("");
    setDescription("");
    setDate(new Date());
    setIsCalendarOpen(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFundId || !amount) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    const numAmount = parseFloat(amount);
    const unallocatedAmount = unallocatedData?.unallocatedAmount || 0;

    if (numAmount <= 0) {
      toast({
        title: "Ошибка",
        description: "Сумма должна быть больше нуля",
        variant: "destructive",
      });
      return;
    }

    if (numAmount > unallocatedAmount) {
      toast({
        title: "Ошибка",
        description: "Сумма не может превышать нераспределенные средства",
        variant: "destructive",
      });
      return;
    }

    const distributionData: InsertManualFundDistribution = {
      fundId: selectedFundId,
      amount: amount,
      description: description || null,
      date: date,
    };

    createMutation.mutate(distributionData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(amount);
  };

  const activeFunds = funds.filter(fund => fund.isActive);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
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
                  Доступно для распределения:
                </span>
              </div>
              <span className="font-bold text-blue-900 dark:text-blue-100">
                {formatCurrency(unallocatedData?.unallocatedAmount || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fundId">Фонд *</Label>
            <Select value={selectedFundId} onValueChange={setSelectedFundId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите фонд" />
              </SelectTrigger>
              <SelectContent>
                {activeFunds.map((fund) => (
                  <SelectItem key={fund.id} value={fund.id}>
                    {fund.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Сумма (RUB) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              max={unallocatedData?.unallocatedAmount || 0}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Дата *</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "d MMMM yyyy", { locale: ru }) : "Выберите дату"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(selectedDate) => {
                    if (selectedDate) {
                      setDate(selectedDate);
                      setIsCalendarOpen(false);
                    }
                  }}
                  locale={ru}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              placeholder="Описание распределения (необязательно)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || !selectedFundId || !amount}
              className="bg-primary hover:bg-primary/90"
            >
              {createMutation.isPending ? "Создание..." : "Создать"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}