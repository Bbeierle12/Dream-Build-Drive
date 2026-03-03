import { create } from "zustand"

type UIState = {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  mediaFilter: "all" | "photos" | "documents"
  setMediaFilter: (filter: "all" | "photos" | "documents") => void
  expandedCategories: Set<string>
  toggleCategory: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  mediaFilter: "all",
  setMediaFilter: (filter) => set({ mediaFilter: filter }),
  expandedCategories: new Set<string>(),
  toggleCategory: (id) =>
    set((state) => {
      const next = new Set(state.expandedCategories)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { expandedCategories: next }
    }),
}))
