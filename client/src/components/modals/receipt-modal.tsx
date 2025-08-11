import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertReceiptSchema, type Receipt, type Sponsor } from "@shared/schema";
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

const formSchema = insertReceiptSchema.extend({
  date: z.string().min(1, "Date is required"),
  amount: z.string().min(1, "Amount is required"),
});

type FormData = z.infer<typeof formSchema>;

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt?: Receipt | null;
}

export default function ReceiptModal({ isOpen, onClose, receipt }: ReceiptModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sponsors = [] } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
    enabled: isOpen,
    retry: false,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      description: "",
      amount: "",
      sponsorId: "none",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const submitData = {
        ...data,
        date: new Date(data.date),
        amount: parseFloat(data.amount),
        sponsorId: data.sponsorId === "none" ? null : data.sponsorId || null,
      };
      const url = receipt ? `/api/receipts/${receipt.id}` : "/api/receipts";
      const method = receipt ? "PUT" : "POST";
      return await apiRequest(method, url, submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Success",
        description: `Receipt ${receipt ? "updated" : "created"} successfully`,
      });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: `Failed to ${receipt ? "update" : "create"} receipt`,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (receipt) {
      const receiptDate = new Date(receipt.date);
      form.reset({
        date: receiptDate.toISOString().split('T')[0],
        description: receipt.description,
        amount: receipt.amount.toString(),
        sponsorId: receipt.sponsorId || "none",
      });
    } else {
      form.reset({
        date: new Date().toISOString().split('T')[0],
        description: "",
        amount: "",
        sponsorId: "none",
      });
    }
  }, [receipt, form]);

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
          <DialogTitle>{receipt ? "Редактировать поступление" : "Добавить поступление"}</DialogTitle>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Введите описание"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sponsorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>От спонсора</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите спонсора (необязательно)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Прямое/Другое</SelectItem>
                      {sponsors.map((sponsor) => (
                        <SelectItem key={sponsor.id} value={sponsor.id}>
                          {sponsor.name}
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Сумма</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        $
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
                className="flex-1 bg-secondary hover:bg-green-700"
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
