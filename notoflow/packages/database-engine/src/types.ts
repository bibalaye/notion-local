export type ColumnType =
  | "text"
  | "number"
  | "select"
  | "multi-select"
  | "date"
  | "checkbox"
  | "url"
  | "email"
  | "phone"
  | "people"
  | "files"
  | "relation"
  | "formula"
  | "status"
  | "tags";

export interface DatabaseColumn {
  id: string;
  name: string;
  type: ColumnType;
  config?: {
    options?: { id: string; label: string; color: string }[];
    formula?: string;
    relatedDatabaseId?: string;
    dateFormat?: string;
  };
  width?: number;
  visible?: boolean;
}

export type ViewType = "table" | "kanban" | "calendar" | "gallery" | "list" | "timeline";

export interface DatabaseView {
  id: string;
  name: string;
  type: ViewType;
  filters: Filter[];
  sorts: Sort[];
  groups?: { columnId: string; direction: "asc" | "desc" };
  kanbanColumnId?: string;
  calendarDateId?: string;
}

export interface Filter {
  id: string;
  columnId: string;
  operator: "equals" | "contains" | "gt" | "lt" | "empty" | "not_empty";
  value: unknown;
}

export interface Sort {
  columnId: string;
  direction: "asc" | "desc";
}

export interface DatabaseRow {
  id: string;
  databaseId: string;
  values: Record<string, unknown>;
  position: number;
}
