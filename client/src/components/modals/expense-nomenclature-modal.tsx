import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { insertExpenseNomenclatureSchema, type ExpenseNomenclature } from "@shared/schema";
import { z } from "zod";

const formSchema = insertExpenseNomenclatureSchema.extend({
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface ExpenseNomenclatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  nomenclature?: ExpenseNomenclature | null;
}

export default function ExpenseNomenclatureModal({ 
  isOpen, 
  onClose, 
  nomenclature 
}: ExpenseNomenclatureModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (nomenclature) {
      form.reset({
        name: nomenclature.name,
        description: nomenclature.description || "",
        isActive: nomenclature.isActive,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        isActive: true,
      });
    }
  }, [nomenclature, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const url = nomenclature 
        ? `/api/expense-nomenclature/${nomenclature.id}` 
        : "/api/expense-nomenclature";
      const method = nomenclature ? "PUT" : "POST";
      
      return await apiRequest(url, method, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-nomenclature"] });
      queryClient.invalidateQueries({ queryKey: ["/api/costs"] });
      toast({
        title: "Успешно",
        description: nomenclature 
          ? "Номенклатура обновлена успешно" 
          : "Номенклатура создана успешно",
      });
      onClose();
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
        description: nomenclature 
          ? "Не удалось обновить номенклатуру" 
          : "Не удалось создать номенклатуру",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {nomenclature ? "Редактировать номенклатуру" : "Добавить номенклатуру"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Введите название номенклатуры" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Введите описание (необязательно)"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Активная</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Неактивные номенклатуры не отображаются при создании расходов
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Отмена
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="bg-secondary hover:bg-green-700"
              >
                {mutation.isPending 
                  ? "Сохранение..." 
                  : nomenclature 
                    ? "Обновить" 
                    : "Создать"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}