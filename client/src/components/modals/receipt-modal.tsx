import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { type Receipt, type Sponsor, type IncomeSource } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, Calculator, Info } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface SponsorItem {
  sponsorId: string;
  amount: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt?: Receipt | null;
}

export default function ReceiptModal({ isOpen, onClose, receipt }: ReceiptModalProps) {
  const [selectedIncomeSourceId, setSelectedIncomeSourceId] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState<string>("");
  const [sponsorItems, setSponsorItems] = useState<SponsorItem[]>([{ sponsorId: "", amount: "" }]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sponsors = [] } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
    enabled: isOpen,
    retry: false,
  });

  const { data: incomeSources = [] } = useQuery<IncomeSource[]>({
    queryKey: ["/api/income-sources"],
    enabled: isOpen,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      incomeSourceId: string;
      date: Date;
      description: string;
      sponsorItems: SponsorItem[];
    }) => {
      const totalAmount = data.sponsorItems.reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0);
      
      // Create receipt
      const receiptData = {
        incomeSourceId: data.incomeSourceId,
        date: data.date,
        description: data.description,
        amount: totalAmount.toString(),
      };
      
      const newReceipt = await apiRequest("/api/receipts", "POST", receiptData);
      
      // Create receipt items for each sponsor
      for (const item of data.sponsorItems) {
        if (item.sponsorId && item.amount && parseFloat(item.amount) > 0) {
          await apiRequest(`/api/receipts/${newReceipt.id}/items`, "POST", {
            sponsorId: item.sponsorId,
            amount: parseFloat(item.amount),
          });
        }
      }
      
      return newReceipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/funds-with-balances"] });
      queryClient.invalidateQueries({ queryKey: ["/api/unallocated-funds"] });
      toast({
        title: "Успешно",
        description: "Поступление создано успешно",
      });
      handleClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Неавторизован",
          description: "Вы вышли из системы. Выполняется повторный вход...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Ошибка",
        description: "Не удалось создать поступление",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setSelectedIncomeSourceId("");
    setDate(new Date());
    setDescription("");
    setSponsorItems([{ sponsorId: "", amount: "" }]);
    setIsCalendarOpen(false);
    onClose();
  };

  const addSponsorItem = () => {
    setSponsorItems([...sponsorItems, { sponsorId: "", amount: "" }]);
  };

  const removeSponsorItem = (index: number) => {
    if (sponsorItems.length > 1) {
      setSponsorItems(sponsorItems.filter((_, i) => i !== index));
    }
  };

  const updateSponsorItem = (index: number, field: keyof SponsorItem, value: string) => {
    const updated = [...sponsorItems];
    updated[index][field] = value;
    setSponsorItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedIncomeSourceId) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите источник поступления",
        variant: "destructive",
      });
      return;
    }

    const validItems = sponsorItems.filter(item => item.sponsorId && item.amount && parseFloat(item.amount) > 0);
    
    if (validItems.length === 0) {
      toast({
        title: "Ошибка",
        description: "Добавьте хотя бы одного спонсора с суммой",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      incomeSourceId: selectedIncomeSourceId,
      date,
      description,
      sponsorItems: validItems,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(amount);
  };

  const getTotalAmount = () => {
    return sponsorItems.reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0);
  };

  const getSponsorName = (sponsorId: string) => {
    const sponsor = sponsors.find(s => s.id === sponsorId);
    return sponsor?.name || "Неизвестный спонсор";
  };

  const activeSources = incomeSources.filter(source => source.isActive);
  const activeSponsors = sponsors.filter(sponsor => sponsor.isActive);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Добавить поступление</span>
          </DialogTitle>
          <DialogDescription>
            Выберите источник поступления и добавьте спонсоров с их суммами
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Income Source Selection */}
          <div className="space-y-2">
            <Label htmlFor="incomeSource">Источник поступления *</Label>
            <Select value={selectedIncomeSourceId} onValueChange={setSelectedIncomeSourceId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите источник поступления" />
              </SelectTrigger>
              <SelectContent>
                {activeSources.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              placeholder="Описание поступления (необязательно)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Sponsors Table */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Спонсоры и суммы *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSponsorItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить спонсора
              </Button>
            </div>

            <Card>
              <CardContent className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Спонсор</TableHead>
                      <TableHead>Сумма (RUB)</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sponsorItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={item.sponsorId}
                            onValueChange={(value) => updateSponsorItem(index, "sponsorId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите спонсора" />
                            </SelectTrigger>
                            <SelectContent>
                              {activeSponsors.map((sponsor) => (
                                <SelectItem key={sponsor.id} value={sponsor.id}>
                                  {sponsor.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={item.amount}
                            onChange={(e) => updateSponsorItem(index, "amount", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSponsorItem(index)}
                            disabled={sponsorItems.length === 1}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Total Amount */}
            <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calculator className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-900 dark:text-green-100">
                      Общая сумма:
                    </span>
                  </div>
                  <span className="text-xl font-bold text-green-900 dark:text-green-100">
                    {formatCurrency(getTotalAmount())}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || !selectedIncomeSourceId || getTotalAmount() === 0}
              className="bg-primary hover:bg-primary/90"
            >
              {createMutation.isPending ? "Создание..." : "Сохранить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
