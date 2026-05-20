import type { BlockId, PageId, UserId, WorkspaceId } from "./ids";

/** Authentification minimale — étendre avec sessions OAuth, etc. */
export type AuthUser = {
  id: UserId;
  email: string;
  name: string | null;
};

export type WorkspaceRole = "owner" | "admin" | "member" | "guest";

export type WorkspaceMember = {
  userId: UserId;
  workspaceId: WorkspaceId;
  role: WorkspaceRole;
};

export type { BlockId, PageId, UserId, WorkspaceId };
