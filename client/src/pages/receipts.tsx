import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, ArrowUpDown } from "lucide-react";
import ReceiptModal from "@/components/modals/receipt-modal";
import type { Receipt } from "@shared/schema";

export default function Receipts() {
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: receipts = [], isLoading: receiptsLoading } = useQuery<(Receipt & { sponsorName?: string })[]>({
    queryKey: ["/api/receipts", search, fromDate, toDate],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/receipts/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Успешно",
        description: "Поступление удалено успешно",
      });
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
        description: "Не удалось удалить поступление",
        variant: "destructive",
      });
    },
  });

  const handleAdd = () => {
    setEditingReceipt(null);
    setIsModalOpen(true);
  };

  const handleEdit = (receipt: Receipt) => {
    setEditingReceipt(receipt);
    setIsModalOpen(true);
  };

  const handleDelete = (receipt: Receipt) => {
    if (confirm(`Вы уверены, что хотите удалить это поступление?`)) {
      deleteMutation.mutate(receipt.id);
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(parseFloat(amount));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading || receiptsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <div className="h-8 bg-muted rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-5 bg-muted rounded w-48 animate-pulse"></div>
          </div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
        <div className="data-table animate-pulse">
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Поступления</h2>
            <p className="text-gray-600">Отслеживание доходов и поступлений</p>
          </div>
          <Button 
            onClick={handleAdd}
            className="bg-secondary hover:bg-green-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Добавить поступление
          </Button>
        </div>

        <div className="data-table">
          <div className="p-4 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Поиск поступлений..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="date"
                placeholder="Дата от"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-auto"
              />
              <Input
                type="date"
                placeholder="Дата до"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center">
                      Дата
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>От</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center">
                      Сумма
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {search || fromDate || toDate ? "Поступления по вашим критериям не найдены." : "Поступлений пока нет. Добавьте своё первое поступление, чтобы начать."}
                    </TableCell>
                  </TableRow>
                ) : (
                  receipts.map((receipt: Receipt & { sponsorName?: string }) => (
                    <TableRow key={receipt.id} className="hover:bg-muted/50">
                      <TableCell>{formatDate(receipt.date.toString())}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{receipt.description}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {receipt.sponsorName || "Неизвестный источник"}
                      </TableCell>
                      <TableCell className="amount-positive">
                        {formatCurrency(receipt.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(receipt)}
                            className="text-primary hover:text-blue-700 hover:bg-primary/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(receipt)}
                            className="text-destructive hover:text-red-700 hover:bg-destructive/10"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <ReceiptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        receipt={editingReceipt}
      />
    </>
  );
}
