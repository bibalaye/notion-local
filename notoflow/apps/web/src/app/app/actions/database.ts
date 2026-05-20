"use server";

import { db } from "@notoflow/database";
import { getOrCreateProfile } from "@/lib/supabase/auth-helper";
import { revalidatePath } from "next/cache";

async function verifyAccess(workspaceId: string, roles = ["OWNER", "ADMIN", "EDITOR", "VIEWER", "GUEST"]) {
  const profile = await getOrCreateProfile();
  if (!profile) throw new Error("Non autorisé.");
  const m = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: profile.id, workspaceId } },
  });
  if (!m || !roles.includes(m.role)) throw new Error("Accès refusé.");
  return profile;
}

export async function getDatabases(workspaceId: string) {
  await verifyAccess(workspaceId);
  return db.database.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" } });
}

export async function getDatabase(databaseId: string) {
  const database = await db.database.findUnique({ where: { id: databaseId }, include: { rows: { orderBy: { position: "asc" } } } });
  if (!database) throw new Error("Base de données introuvable.");
  await verifyAccess(database.workspaceId);
  return database;
}

export async function createDatabase(workspaceId: string, name: string, pageId?: string) {
  await verifyAccess(workspaceId, ["OWNER", "ADMIN", "EDITOR"]);
  const defaultSchema = [
    { id: "col-name", name: "Nom", type: "text", visible: true },
    { id: "col-status", name: "Statut", type: "select", visible: true, config: { options: [{ id: "todo", label: "À faire", color: "#6366f1" }, { id: "progress", label: "En cours", color: "#f59e0b" }, { id: "done", label: "Terminé", color: "#22c55e" }] } },
    { id: "col-date", name: "Date", type: "date", visible: true },
  ];
  const defaultViews = [
    { id: "view-table", name: "Table", type: "table", filters: [], sorts: [] },
    { id: "view-kanban", name: "Kanban", type: "kanban", filters: [], sorts: [], kanbanColumnId: "col-status" },
    { id: "view-calendar", name: "Calendrier", type: "calendar", filters: [], sorts: [], calendarDateId: "col-date" },
  ];
  const database = await db.database.create({
    data: { workspaceId, pageId: pageId || null, name, schema: defaultSchema as any, views: defaultViews as any },
  });
  revalidatePath("/app", "layout");
  return database;
}

export async function updateDatabase(databaseId: string, data: { name?: string; schema?: any; views?: any }) {
  const database = await db.database.findUnique({ where: { id: databaseId } });
  if (!database) throw new Error("Introuvable.");
  await verifyAccess(database.workspaceId, ["OWNER", "ADMIN", "EDITOR"]);
  
  const updateData: typeof data = { ...data };
  if (data.schema !== undefined) {
    updateData.schema = JSON.parse(JSON.stringify(data.schema));
  }
  if (data.views !== undefined) {
    updateData.views = JSON.parse(JSON.stringify(data.views));
  }

  const updated = await db.database.update({ 
    where: { id: databaseId }, 
    data: { ...updateData, updatedAt: new Date() } 
  });
  revalidatePath("/app", "layout");
  return updated;
}

export async function createDatabaseRow(databaseId: string, values?: Record<string, unknown>) {
  const database = await db.database.findUnique({ where: { id: databaseId } });
  if (!database) throw new Error("Introuvable.");
  await verifyAccess(database.workspaceId, ["OWNER", "ADMIN", "EDITOR"]);
  const count = await db.databaseRow.count({ where: { databaseId } });
  
  const cleanValues = values ? JSON.parse(JSON.stringify(values)) : {};

  const row = await db.databaseRow.create({
    data: { databaseId, values: cleanValues, position: count },
  });
  revalidatePath("/app", "layout");
  return row;
}

export async function updateDatabaseRow(rowId: string, values: Record<string, unknown>) {
  const row = await db.databaseRow.findUnique({ where: { id: rowId }, include: { database: true } });
  if (!row) throw new Error("Ligne introuvable.");
  await verifyAccess(row.database.workspaceId, ["OWNER", "ADMIN", "EDITOR"]);
  
  const cleanValues = JSON.parse(JSON.stringify(values));

  const updated = await db.databaseRow.update({ 
    where: { id: rowId }, 
    data: { values: cleanValues, updatedAt: new Date() } 
  });
  revalidatePath("/app", "layout");
  return updated;
}

export async function deleteDatabaseRow(rowId: string) {
  const row = await db.databaseRow.findUnique({ where: { id: rowId }, include: { database: true } });
  if (!row) throw new Error("Ligne introuvable.");
  await verifyAccess(row.database.workspaceId, ["OWNER", "ADMIN"]);
  await db.databaseRow.delete({ where: { id: rowId } });
  revalidatePath("/app", "layout");
}
