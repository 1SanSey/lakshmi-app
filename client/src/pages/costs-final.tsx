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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Edit, Trash2, Package, Calendar, Filter } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { 
  Cost, 
  CostItem, 
  ExpenseCategory, 
  ExpenseNomenclature,
  InsertCost,
  InsertCostItem 
} from "@shared/schema";
import { insertCostSchema, insertCostItemSchema } from "@shared/schema";

// Форма для создания расхода
const costFormSchema = insertCostSchema.extend({
  date: z.string().min(1, "Дата обязательна"),
  items: z.array(insertCostItemSchema.extend({
    expenseNomenclatureId: z.string().min(1, "Выберите номенклатуру"),
    quantity: z.number().min(0.01, "Количество должно быть больше 0"),
    unitPrice: z.number().min(0, "Цена за единицу не может быть отрицательной"),
  })).min(1, "Добавьте хотя бы одну позицию"),
});

type CostFormData = z.infer<typeof costFormSchema>;

type CostWithDetails = Cost & {
  expenseCategoryName?: string;
  items?: (CostItem & { nomenclatureName?: string })[];
};

export default function Costs() {
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

  const { data: nomenclature = [] } = useQuery<ExpenseNomenclature[]>({
    queryKey: ["/api/expense-nomenclature"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Форма для создания расхода
  const form = useForm<CostFormData>({
    resolver: zodResolver(costFormSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      description: "",
      expenseCategoryId: "",
      totalAmount: 0,
      items: [
        {
          expenseNomenclatureId: "",
          quantity: 1,
          unitPrice: 0,
          amount: 0,
          description: "",
        }
      ],
    },
  });

  // Мутации
  const createCostMutation = useMutation({
    mutationFn: async (data: CostFormData) => {
      // Создаем расход
      const costData = {
        date: new Date(data.date),
        description: data.description,
        expenseCategoryId: data.expenseCategoryId,
        totalAmount: data.totalAmount,
      };
      
      const cost = await apiRequest("/api/costs", "POST", costData);
      
      // Добавляем позиции
      for (const item of data.items) {
        await apiRequest(`/api/costs/${cost.id}/items`, "POST", item);
      }
      
      return cost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Успех",
        description: "Расход успешно создан",
      });
      setIsCreateModalOpen(false);
      form.reset();
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
        description: "Не удалось создать расход",
        variant: "destructive",
      });
    },
  });

  const deleteCostMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/costs/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Успех",
        description: "Расход удален",
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

  // Обработчики событий
  const handleCreateCost = (data: CostFormData) => {
    createCostMutation.mutate(data);
  };

  const handleDeleteCost = (id: string) => {
    if (confirm("Вы уверены, что хотите удалить этот расход?")) {
      deleteCostMutation.mutate(id);
    }
  };

  const addItem = () => {
    const currentItems = form.getValues("items");
    form.setValue("items", [
      ...currentItems,
      {
        expenseNomenclatureId: "",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        description: "",
      }
    ]);
  };

  const removeItem = (index: number) => {
    const currentItems = form.getValues("items");
    if (currentItems.length > 1) {
      form.setValue("items", currentItems.filter((_, i) => i !== index));
      updateTotalAmount();
    }
  };

  const updateItemAmount = (index: number) => {
    const items = form.getValues("items");
    const item = items[index];
    const amount = item.quantity * item.unitPrice;
    
    form.setValue(`items.${index}.amount`, amount);
    updateTotalAmount();
  };

  const updateTotalAmount = () => {
    const items = form.getValues("items");
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    form.setValue("totalAmount", total);
  };

  if (isLoading) return <div>Загрузка...</div>;
  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Расходы</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Добавить расход
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Создать расход</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateCost)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дата</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expenseCategoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Категория расходов</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите категорию" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {expenseCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Описание расхода" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Позиции расхода</h3>
                    <Button type="button" variant="outline" onClick={addItem}>
                      <Plus className="mr-2 h-4 w-4" />
                      Добавить позицию
                    </Button>
                  </div>
                  
                  {form.watch("items").map((_, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.expenseNomenclatureId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Номенклатура</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Выберите" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {nomenclature.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Количество</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(parseFloat(e.target.value) || 0);
                                    setTimeout(() => updateItemAmount(index), 0);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`items.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Цена за ед.</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(parseFloat(e.target.value) || 0);
                                    setTimeout(() => updateItemAmount(index), 0);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`items.${index}.amount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Сумма</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  {...field}
                                  readOnly
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex items-end">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeItem(index)}
                            disabled={form.watch("items").length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Примечание</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Дополнительное описание позиции" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </Card>
                  ))}
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-lg font-semibold">Общая сумма:</span>
                  <span className="text-xl font-bold">
                    {form.watch("totalAmount").toLocaleString("ru-RU")} ₽
                  </span>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Отмена
                  </Button>
                  <Button type="submit" disabled={createCostMutation.isPending}>
                    {createCostMutation.isPending ? "Создание..." : "Создать расход"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Поиск</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
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
                    <div className="text-lg font-bold">
                      {cost.totalAmount.toLocaleString("ru-RU")} ₽
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
              
              {cost.items && cost.items.length > 0 && (
                <CardContent>
                  <h4 className="font-semibold mb-3">Позиции расхода:</h4>
                  <div className="space-y-2">
                    {cost.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{item.nomenclatureName}</span>
                          {item.description && (
                            <span className="text-sm text-gray-600 ml-2">({item.description})</span>
                          )}
                        </div>
                        <div className="text-right">
                          <div>{item.quantity} × {item.unitPrice.toLocaleString("ru-RU")} ₽</div>
                          <div className="font-semibold">
                            {item.amount.toLocaleString("ru-RU")} ₽
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}