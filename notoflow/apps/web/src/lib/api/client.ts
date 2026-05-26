import { useWorkspaceStore } from "../store/useWorkspaceStore";
import {
  getWorkspaces,
  createWorkspace,
  getWorkspace,
  addWorkspaceMember,
  inviteMember,
  getWorkspaceInvites,
  revokeInvite,
  generateInviteLink,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
} from "@/app/app/actions/workspace";
import {
  getWorkspacePages,
  createPage,
  createPageFromTemplate,
  getPage,
  updatePage,
  duplicatePage,
  archivePage,
  restorePage,
  deletePagePermanently,
  getArchivedPages,
  getPageVersions,
  toggleFavorite,
  getFavorites,
} from "@/app/app/actions/pages";
import { db } from "@notoflow/database"; // Just in case, but keep it client safe

export const api = {
  workspaces: {
    list: getWorkspaces,
    create: createWorkspace,
    get: getWorkspace,
    getMembers: async (workspaceId: string) => {
      const ws = await getWorkspace(workspaceId);
      return ws?.members || [];
    },
    inviteMember: addWorkspaceMember,
    invite: inviteMember,
    getInvites: getWorkspaceInvites,
    revokeInvite,
    generateInviteLink,
    updateMemberRole: updateWorkspaceMemberRole,
    removeMember: removeWorkspaceMember,
  },
  pages: {
    getTree: async () => {
      let wsId = useWorkspaceStore.getState().activeWorkspaceId;
      if (!wsId) {
        const list = await getWorkspaces();
        if (list.length > 0) {
          wsId = list[0].id;
          useWorkspaceStore.getState().setActiveWorkspaceId(wsId);
        } else {
          return [];
        }
      }
      return getWorkspacePages(wsId);
    },
    create: async (parentId?: string | null) => {
      let wsId = useWorkspaceStore.getState().activeWorkspaceId;
      if (!wsId) {
        const list = await getWorkspaces();
        if (list.length > 0) {
          wsId = list[0].id;
          useWorkspaceStore.getState().setActiveWorkspaceId(wsId);
        } else {
          throw new Error("Aucun espace de travail actif.");
        }
      }
      return createPage(wsId, parentId);
    },
    createFromTemplate: async (templateId: string) => {
      let wsId = useWorkspaceStore.getState().activeWorkspaceId;
      if (!wsId) {
        const list = await getWorkspaces();
        if (list.length > 0) {
          wsId = list[0].id;
          useWorkspaceStore.getState().setActiveWorkspaceId(wsId);
        } else {
          throw new Error("Aucun espace de travail actif.");
        }
      }
      return createPageFromTemplate(wsId, templateId);
    },
    get: getPage,
    update: updatePage,
    duplicate: duplicatePage,
    archive: archivePage,
    restore: restorePage,
    deletePermanently: deletePagePermanently,
    getArchived: getArchivedPages,
    getVersions: getPageVersions,
    toggleFavorite: toggleFavorite,
  },
  favorites: {
    list: async () => {
      let wsId = useWorkspaceStore.getState().activeWorkspaceId;
      if (!wsId) {
        const list = await getWorkspaces();
        if (list.length > 0) {
          wsId = list[0].id;
          useWorkspaceStore.getState().setActiveWorkspaceId(wsId);
        } else {
          return [];
        }
      }
      return getFavorites(wsId);
    },
  },
  search: {
    global: async (query: string) => {
      if (!query || query.length < 2) return [];
      const wsId = useWorkspaceStore.getState().activeWorkspaceId;
      if (!wsId) return [];

      // We will perform a simple search over our API or Server Action
      const { searchPages } = await import("@/app/app/actions/search");
      return searchPages(wsId, query);
    },
  },
};
