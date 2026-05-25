"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type ComponentProps } from "react";

type TransitionLinkProps = ComponentProps<typeof Link> & {
  showLoader?: boolean;
};

/**
 * Link component avec transition fluide
 * Utilise useTransition pour éviter le blocage de l'UI pendant la navigation
 */
export function TransitionLink({ 
  href, 
  children, 
  showLoader = false,
  onClick,
  ...props 
}: TransitionLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Si c'est un lien externe ou avec modificateur, laisser le comportement par défaut
    if (
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      typeof href === "object" ||
      (typeof href === "string" && (href.startsWith("http") || href.startsWith("mailto:")))
    ) {
      onClick?.(e);
      return;
    }

    e.preventDefault();

    // Appeler le onClick custom si fourni
    onClick?.(e);

    // Navigation avec transition
    startTransition(() => {
      router.push(href.toString());
    });
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      {...props}
      className={`${props.className || ""} ${isPending && showLoader ? "opacity-60 pointer-events-none" : ""}`}
    >
      {children}
    </Link>
  );
}
