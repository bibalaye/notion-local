"use client";

import { api } from "@/lib/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function CreatePageButton({ className }: { className?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () => api.pages.create(null),
    onSuccess: (newPage) => {
      queryClient.invalidateQueries({ queryKey: ["pages", "tree"] });
      toast.success("Page créée !");
      if (newPage) {
        router.push(`/app/page/${newPage.id}`);
      }
    },
    onError: () => {
      toast.error("Erreur lors de la création de la page.");
    },
  });

  return (
    <button
      onClick={() => createMutation.mutate()}
      disabled={createMutation.isPending}
      className={className}
      type="button"
    >
      {createMutation.isPending ? "Création..." : "Nouveau document"}
    </button>
  );
}
