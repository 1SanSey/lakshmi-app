import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertCostSchema, type Cost, type Fund, type ExpenseCategory, type ExpenseNomenclature } from "@shared/schema";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";



const formSchema = z.object({
  date: z.string().min(1, "Дата обязательна"),
  expenseNomenclatureId: z.string().min(1, "Выбор номенклатуры обязателен"),
  totalAmount: z.string().min(1, "Сумма обязательна"),
  expenseCategoryId: z.string().min(1, "Выбор категории обязателен"),
  fundId: z.string().min(1, "Выбор фонда обязателен"),
});

type FormData = z.infer<typeof formSchema>;

interface CostModalProps {
  isOpen: boolean;
  onClose: () => void;
  cost?: Cost | null;
}

export default function CostModal({ isOpen, onClose, cost }: CostModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: funds = [] } = useQuery<Fund[]>({
    queryKey: ["/api/funds-with-balances"],
  });

  const { data: expenseCategories = [] } = useQuery<ExpenseCategory[]>({
    queryKey: ["/api/expense-categories"],
  });

  const { data: expenseNomenclature = [] } = useQuery<ExpenseNomenclature[]>({
    queryKey: ["/api/expense-nomenclature"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      expenseNomenclatureId: "",
      totalAmount: "",
      expenseCategoryId: "",
      fundId: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (cost) {
        form.reset({
          date: cost.date.toISOString().split('T')[0],
          expenseNomenclatureId: cost.expenseNomenclatureId || "",
          totalAmount: cost.totalAmount.toString(),
          expenseCategoryId: cost.expenseCategoryId,
          fundId: cost.fundId,
        });
      } else {
        form.reset({
          date: new Date().toISOString().split('T')[0],
          expenseNomenclatureId: "",
          totalAmount: "",
          expenseCategoryId: "",
          fundId: "",
        });
      }
    }
  }, [cost, form, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const url = cost ? `/api/costs/${cost.id}` : "/api/costs";
      const method = cost ? "PUT" : "POST";
      return await apiRequest(url, method, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/funds-with-balances"] });
      toast({
        title: "Успешно",
        description: `Расход ${cost ? "обновлен" : "создан"} успешно`,
      });
      onClose();
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
        description: `Не удалось ${cost ? "обновить" : "создать"} расход`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{cost ? "Редактировать расход" : "Добавить расход"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="expenseNomenclatureId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Номенклатура расходов *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите номенклатуру расходов" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseNomenclature.map((nomenclature) => (
                        <SelectItem key={nomenclature.id} value={nomenclature.id}>
                          {nomenclature.name}
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
              name="expenseCategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Категория расходов</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите категорию расходов" />
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

            <FormField
              control={form.control}
              name="fundId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Фонд для списания</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите фонд" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {funds.map((fund) => (
                        <SelectItem key={fund.id} value={fund.id}>
                          {fund.name} ({(fund as any).balance?.toLocaleString('ru-RU')}₽)
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
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Общая сумма</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        ₽
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-8"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 bg-destructive hover:bg-red-700"
              >
                {mutation.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
