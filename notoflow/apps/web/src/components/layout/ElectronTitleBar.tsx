"use client";

import { Minus, Square, X, Maximize2 } from "lucide-react";
import { useElectron } from "@/lib/hooks/useElectron";

/**
 * Barre de titre custom pour l'app Electron (Windows / Linux).
 * Sur macOS, les traffic lights natifs sont utilisés (titleBarStyle: "hiddenInset").
 * Dans le navigateur, ce composant ne s'affiche pas.
 */
export function ElectronTitleBar() {
  const { isElectron, isMac, isMaximized, minimize, maximize, close } = useElectron();

  // Pas d'affichage dans le navigateur ou sur macOS (traffic lights natifs)
  if (!isElectron || isMac) return null;

  return (
    <div
      className="flex items-center justify-between h-8 bg-background border-b border-border/20 select-none shrink-0"
      // La zone draggable permet de déplacer la fenêtre
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {/* Logo / Titre */}
      <div className="flex items-center gap-2 px-3">
        <span className="text-[11px] font-semibold text-muted-foreground tracking-wide">
          NotoFlow
        </span>
      </div>

      {/* Boutons de contrôle — zone non-draggable */}
      <div
        className="flex items-center h-full"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        {/* Réduire */}
        <button
          onClick={minimize}
          className="flex items-center justify-center w-11 h-full text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors duration-100 focus:outline-none"
          title="Réduire"
          type="button"
        >
          <Minus className="h-3.5 w-3.5 stroke-[1.8]" />
        </button>

        {/* Agrandir / Restaurer */}
        <button
          onClick={maximize}
          className="flex items-center justify-center w-11 h-full text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors duration-100 focus:outline-none"
          title={isMaximized ? "Restaurer" : "Agrandir"}
          type="button"
        >
          {isMaximized ? (
            <Maximize2 className="h-3 w-3 stroke-[1.8]" />
          ) : (
            <Square className="h-3 w-3 stroke-[1.8]" />
          )}
        </button>

        {/* Fermer */}
        <button
          onClick={close}
          className="flex items-center justify-center w-11 h-full text-muted-foreground hover:bg-destructive hover:text-white transition-colors duration-100 focus:outline-none"
          title="Fermer"
          type="button"
        >
          <X className="h-3.5 w-3.5 stroke-[1.8]" />
        </button>
      </div>
    </div>
  );
}
