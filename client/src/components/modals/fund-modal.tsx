import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertFundSchema } from "@shared/schema";
import type { Fund } from "@shared/schema";

const formSchema = insertFundSchema.extend({
  initialBalance: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "Сумма должна быть неотрицательным числом"),
});

type FormData = z.infer<typeof formSchema>;

interface FundModalProps {
  open: boolean;
  onClose: () => void;
  fund?: Fund | null;
}

export default function FundModal({ open, onClose, fund }: FundModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      initialBalance: "0",
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (fund) {
        form.reset({
          name: fund.name,
          description: fund.description || "",
          initialBalance: fund.initialBalance || "0",
          isActive: fund.isActive ?? true,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          initialBalance: "0",
          isActive: true,
        });
      }
    }
  }, [fund, form, open]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const endpoint = fund ? `/api/funds/${fund.id}` : "/api/funds";
      const method = fund ? "PUT" : "POST";
      
      return await apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/funds-with-balances"] });
      toast({
        title: "Успешно",
        description: fund ? "Фонд обновлен!" : "Фонд создан!",
      });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
        description: fund ? "Не удалось обновить фонд" : "Не удалось создать фонд",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{fund ? "Редактировать фонд" : "Создать фонд"}</DialogTitle>
          <DialogDescription>
            {fund ? "Обновить детали фонда и процент распределения." : "Создать новый фонд для распределения входящих поступлений."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название фонда</FormLabel>
                  <FormControl>
                    <Input placeholder="например, Резервный фонд, Сбережения..." {...field} />
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
                  <FormLabel>Описание (необязательно)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Краткое описание назначения фонда..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="initialBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Начальный остаток</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type="number" 
                        placeholder="0"
                        min="0"
                        step="0.01"
                        {...field}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        ₽
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />



            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Активный</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Фонд будет доступен для распределения средств
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Сохранение..." : fund ? "Обновить фонд" : "Создать фонд"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}