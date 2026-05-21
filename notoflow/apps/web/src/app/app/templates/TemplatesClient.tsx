"use client";

import { PAGE_TEMPLATES } from "@/lib/templates/page-templates";
import { api } from "@/lib/api/client";
import { Button } from "@notoflow/ui/components/button";
import { ArrowRight, FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function TemplatesClient() {
  const router = useRouter();
  const [creatingId, setCreatingId] = useState<string | null>(null);

  const handleCreate = async (templateId: string) => {
    setCreatingId(templateId);
    try {
      const page = await api.pages.createFromTemplate(templateId);
      toast.success("Page creee depuis le template");
      router.push(`/app/page/${page.id}`);
      router.refresh();
    } catch {
      toast.error("Impossible de creer la page");
    } finally {
      setCreatingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <FileText className="h-4 w-4" />
            Templates
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-foreground">Demarrer plus vite</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Choisissez un modele, puis adaptez-le directement dans votre espace.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {PAGE_TEMPLATES.map((template) => (
          <article
            key={template.id}
            className="group flex min-h-48 flex-col justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/30"
          >
            <div>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-background text-2xl shadow-sm">
                {template.icon}
              </div>
              <h2 className="text-base font-semibold text-foreground">{template.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{template.description}</p>
            </div>

            <Button
              size="sm"
              variant="ghost"
              className="mt-5 h-8 justify-between px-2 text-xs"
              disabled={creatingId !== null}
              onClick={() => handleCreate(template.id)}
            >
              {creatingId === template.id ? (
                <>
                  Creation
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </>
              ) : (
                <>
                  Utiliser
                  <ArrowRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
