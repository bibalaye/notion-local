export type UserId = string & { readonly __brand: "UserId" };
export type WorkspaceId = string & { readonly __brand: "WorkspaceId" };
export type PageId = string & { readonly __brand: "PageId" };
export type BlockId = string & { readonly __brand: "BlockId" };

export function asUserId(id: string): UserId {
  return id as UserId;
}

export function asWorkspaceId(id: string): WorkspaceId {
  return id as WorkspaceId;
}

export function asPageId(id: string): PageId {
  return id as PageId;
}

export function asBlockId(id: string): BlockId {
  return id as BlockId;
}
