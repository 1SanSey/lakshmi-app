import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, ArrowUpDown } from "lucide-react";
import CostModal from "@/components/modals/cost-modal";
import type { Cost } from "@shared/schema";

const COST_CATEGORIES = [
  "Офисные принадлежности",
  "Маркетинг",
  "Путешествия",
  "Коммунальные услуги",
  "Профессиональные услуги",
  "Оборудование",
  "Программное обеспечение",
  "Другое"
];

const CATEGORY_COLORS: Record<string, string> = {
  "Офисные принадлежности": "bg-blue-100 text-blue-800",
  "Маркетинг": "bg-purple-100 text-purple-800",
  "Путешествия": "bg-green-100 text-green-800",
  "Коммунальные услуги": "bg-yellow-100 text-yellow-800",
  "Профессиональные услуги": "bg-indigo-100 text-indigo-800",
  "Оборудование": "bg-red-100 text-red-800",
  "Программное обеспечение": "bg-pink-100 text-pink-800",
  "Другое": "bg-gray-100 text-gray-800"
};

export default function Costs() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<Cost | null>(null);
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

  const { data: costs = [], isLoading: costsLoading } = useQuery<Cost[]>({
    queryKey: ["/api/costs", search, category, fromDate],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/costs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Успешно",
        description: "Расход удален успешно",
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
        description: "Не удалось удалить расход",
        variant: "destructive",
      });
    },
  });

  const handleAdd = () => {
    setEditingCost(null);
    setIsModalOpen(true);
  };

  const handleEdit = (cost: Cost) => {
    setEditingCost(cost);
    setIsModalOpen(true);
  };

  const handleDelete = (cost: Cost) => {
    if (confirm(`Вы уверены, что хотите удалить этот расход?`)) {
      deleteMutation.mutate(cost.id);
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading || costsLoading) {
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Расходы</h2>
            <p className="text-gray-600">Отслеживание ваших расходов и затрат</p>
          </div>
          <Button 
            onClick={handleAdd}
            className="bg-destructive hover:bg-red-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Добавить расход
          </Button>
        </div>

        <div className="data-table">
          <div className="p-4 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Поиск расходов..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Все категории" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все категории</SelectItem>
                  {COST_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder="Дата от"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
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
                  <TableHead>Категория</TableHead>
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
                {costs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {search || category || fromDate ? "Расходы по вашим критериям не найдены." : "Расходов пока нет. Добавьте свой первый расход, чтобы начать."}
                    </TableCell>
                  </TableRow>
                ) : (
                  costs.map((cost: Cost) => (
                    <TableRow key={cost.id} className="hover:bg-muted/50">
                      <TableCell>{formatDate(cost.date.toString())}</TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{cost.description}</div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={CATEGORY_COLORS[cost.category] || CATEGORY_COLORS["Other"]}
                        >
                          {cost.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="amount-negative">
                        {formatCurrency(cost.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(cost)}
                            className="text-primary hover:text-blue-700 hover:bg-primary/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cost)}
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

      <CostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cost={editingCost}
      />
    </>
  );
}
