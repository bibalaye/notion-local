import type { DatabaseColumn, DatabaseRow, Filter, Sort } from "./types";

/**
 * Moteur de filtrage / tri / groupement côté client (optimistic).
 * Répliquer les mêmes règles côté serveur pour la cohérence.
 */
export class DatabaseEngine {
  static filter(rows: DatabaseRow[], filters: Filter[], columns: DatabaseColumn[]): DatabaseRow[] {
    if (!filters.length) return rows;
    return rows.filter((row) => filters.every((f) => this.matchFilter(row, f, columns)));
  }

  private static matchFilter(row: DatabaseRow, filter: Filter, columns: DatabaseColumn[]): boolean {
    const col = columns.find((c) => c.id === filter.columnId);
    if (!col) return true;
    const value = row.values[filter.columnId];

    switch (filter.operator) {
      case "equals":
        return value === filter.value;
      case "contains":
        return String(value ?? "")
          .toLowerCase()
          .includes(String(filter.value).toLowerCase());
      case "gt":
        return Number(value) > Number(filter.value);
      case "lt":
        return Number(value) < Number(filter.value);
      case "empty":
        return value == null || value === "" || (Array.isArray(value) && !value.length);
      case "not_empty":
        return !(value == null || value === "" || (Array.isArray(value) && !value.length));
      default:
        return true;
    }
  }

  static sort(rows: DatabaseRow[], sorts: Sort[]): DatabaseRow[] {
    if (!sorts.length) return rows;
    return [...rows].sort((a, b) => {
      for (const sort of sorts) {
        const av = a.values[sort.columnId];
        const bv = b.values[sort.columnId];
        if (av === bv) continue;
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = av > bv ? 1 : -1;
        return sort.direction === "desc" ? -cmp : cmp;
      }
      return 0;
    });
  }

  static group(rows: DatabaseRow[], columnId: string): Record<string, DatabaseRow[]> {
    const groups: Record<string, DatabaseRow[]> = {};
    for (const row of rows) {
      const key = String(row.values[columnId] ?? "Sans valeur");
      (groups[key] ??= []).push(row);
    }
    return groups;
  }

  static computeFormula(formula: string, row: DatabaseRow, columns: DatabaseColumn[]): unknown {
    const ctx: Record<string, unknown> = {};
    for (const col of columns) {
      ctx[col.name] = row.values[col.id];
    }
    try {
      // ⚠️ À sandboxer en production (AST / worker dédié).
      const fn = new Function(...Object.keys(ctx), `return (${formula});`);
      return fn(...Object.values(ctx));
    } catch {
      return null;
    }
  }
}

export * from "./types";
