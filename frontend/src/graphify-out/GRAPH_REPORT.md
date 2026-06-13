# Graph Report - frontend\src  (2026-06-13)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 119 nodes · 174 edges · 11 communities (10 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `39602344`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 20 edges
2. `cn()` - 4 edges
3. `getTodos()` - 4 edges
4. `cn()` - 3 edges
5. `Sidebar()` - 3 edges
6. `usePromptInput()` - 3 edges
7. `PromptInputTextarea()` - 3 edges
8. `Button()` - 3 edges
9. `createProject()` - 3 edges
10. `listProjects()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Button()` --calls--> `cn()`  [EXTRACTED]
  components/ui/button.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (11 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.16
Nodes (23): Todo, TodoList(), TodoListProps, apiFetch(), createProject(), createTodo(), deleteChat(), deleteFile() (+15 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (18): Button, ButtonProps, DialogContent, DialogOverlay, DialogTitle, ImageViewDialogProps, PromptInput, PromptInputActionProps (+10 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (11): GRANT_COLORS, GRANT_LABELS, Project, ProjectDetail(), ProjectDetailProps, STATUS_OPTIONS, TabId, TABS (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (11): GRANT_TYPES, NewProjectModal(), NewProjectModalProps, GRANT_COLORS, GRANT_LABELS, Project, ProjectsPage(), ProjectsPageProps (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.20
Nodes (5): ChatView(), ChatViewProps, InputBoxProps, Message, SUGGESTIONS

### Community 5 - "Community 5"
Cohesion: 0.29
Nodes (4): ACCEPT, FileUpload(), FileUploadProps, ProjectFile

### Community 6 - "Community 6"
Cohesion: 0.47
Nodes (5): cn(), NavItem(), NavItemProps, Sidebar(), SidebarProps

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (6): cn(), PromptInputAction(), PromptInputActions(), PromptInputTextarea(), usePromptInput(), VoiceRecorder()

### Community 8 - "Community 8"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 9 - "Community 9"
Cohesion: 0.70
Nodes (3): cn(), Button(), buttonVariants

## Knowledge Gaps
- **48 isolated node(s):** `geistSans`, `geistMono`, `metadata`, `ACCEPT`, `ProjectFile` (+43 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Sidebar()` connect `Community 6` to `Community 2`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `getTodos()` connect `Community 0` to `Community 3`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `geistSans`, `geistMono`, `metadata` to the rest of the system?**
  _48 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.14166666666666666 - nodes in this community are weakly interconnected._