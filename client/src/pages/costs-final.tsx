import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Cost, ExpenseCategory } from "@shared/schema";
import CostModal from "@/components/modals/cost-modal";

type CostWithDetails = Cost & {
  expenseCategoryName?: string;
  fundName?: string;
};

export default function Costs() {
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<Cost | null>(null);

  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  // Редирект на логин если не авторизован
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

  // Загрузка данных
  const { data: costs = [], isLoading: costsLoading } = useQuery<CostWithDetails[]>({
    queryKey: ["/api/costs", search, selectedCategoryId === "all" ? "" : selectedCategoryId, fromDate, toDate],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: expenseCategories = [] } = useQuery<ExpenseCategory[]>({
    queryKey: ["/api/expense-categories"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Удаление расхода
  const deleteCostMutation = useMutation({
    mutationFn: async (costId: string) => {
      return await apiRequest(`/api/costs/${costId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/funds-with-balances"] });
      toast({
        title: "Успешно",
        description: "Расход удален успешно",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Ошибка авторизации",
          description: "Вы не авторизованы. Выполняется вход...",
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

  const handleDeleteCost = (costId: string) => {
    if (confirm("Вы уверены, что хотите удалить этот расход?")) {
      deleteCostMutation.mutate(costId);
    }
  };

  if (isLoading) return <div>Загрузка...</div>;
  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Расходы</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить расход
        </Button>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Поиск</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Поиск по описанию..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Категория</label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Все категории" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все категории</SelectItem>
                  {expenseCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">От даты</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">До даты</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список расходов */}
      <div className="space-y-4">
        {costsLoading ? (
          <div className="text-center py-8">Загрузка расходов...</div>
        ) : costs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Расходы не найдены</h3>
              <p className="text-gray-500 mb-4">
                {search || (selectedCategoryId && selectedCategoryId !== "all") || fromDate || toDate
                  ? "Попробуйте изменить фильтры поиска"
                  : "Начните добавлять расходы в свою систему"}
              </p>
              {!search && (!selectedCategoryId || selectedCategoryId === "all") && !fromDate && !toDate && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить первый расход
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          costs.map((cost) => (
            <Card key={cost.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {format(new Date(cost.date), "d MMMM yyyy", { locale: ru })}
                    </CardTitle>
                    <CardDescription>{cost.description}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {cost.expenseCategoryName || "Без категории"}
                    </Badge>
                    {cost.fundName && (
                      <Badge variant="secondary">
                        {cost.fundName}
                      </Badge>
                    )}
                    <div className="text-lg font-bold">
                      {parseFloat(cost.totalAmount.toString()).toLocaleString("ru-RU")} ₽
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCost(cost.id)}
                      disabled={deleteCostMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {/* Модальные окна */}
      <CostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        cost={editingCost}
      />
    </div>
  );
}