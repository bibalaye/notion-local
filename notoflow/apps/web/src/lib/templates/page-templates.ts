export const PAGE_TEMPLATES = [
  {
    id: "meeting-notes",
    title: "Notes de reunion",
    icon: "📝",
    description: "Ordre du jour, decisions et actions a suivre.",
    content: [
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Notes de reunion" }] },
      { type: "paragraph", content: [{ type: "text", text: "Date, participants et contexte." }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Agenda" }] },
      { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Sujet 1" }] }] }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Decisions" }] },
      { type: "taskList", content: [{ type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Action, responsable, echeance" }] }] }] },
    ],
  },
  {
    id: "project-brief",
    title: "Brief projet",
    icon: "🚀",
    description: "Objectif, scope, risques et prochaines etapes.",
    content: [
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Brief projet" }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Objectif" }] },
      { type: "paragraph", content: [{ type: "text", text: "Quel probleme resout-on et pour qui ?" }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Scope" }] },
      { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Inclus" }] }] }, { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Hors scope" }] }] }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Risques" }] },
      { type: "paragraph", content: [{ type: "text", text: "Hypotheses, dependances et points de vigilance." }] },
    ],
  },
  {
    id: "weekly-plan",
    title: "Plan de semaine",
    icon: "📅",
    description: "Priorites, blocages et routines de suivi.",
    content: [
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Plan de semaine" }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Priorites" }] },
      { type: "taskList", content: [{ type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Priorite principale" }] }] }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "A surveiller" }] },
      { type: "paragraph", content: [{ type: "text", text: "Risques, delais et decisions attendues." }] },
    ],
  },
] as const;
