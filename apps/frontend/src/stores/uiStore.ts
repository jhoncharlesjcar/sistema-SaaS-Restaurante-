import { create } from 'zustand';

interface UIState {
    // Sidebar state
    sidebarOpen: boolean;
    sidebarCollapsed: boolean;

    // Modal states
    isOrderModalOpen: boolean;
    isProductModalOpen: boolean;
    isSettingsModalOpen: boolean;

    // Active selections
    activeTableId: string | null;
    activeOrderId: string | null;
    activeProductId: string | null;

    // Notifications
    pendingSyncCount: number;

    // Actions
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setSidebarCollapsed: (collapsed: boolean) => void;

    openOrderModal: (orderId?: string) => void;
    closeOrderModal: () => void;

    openProductModal: (productId?: string) => void;
    closeProductModal: () => void;

    openSettingsModal: () => void;
    closeSettingsModal: () => void;

    setActiveTable: (tableId: string | null) => void;
    setActiveOrder: (orderId: string | null) => void;

    setPendingSyncCount: (count: number) => void;

    resetUI: () => void;
}

const initialState = {
    sidebarOpen: true,
    sidebarCollapsed: false,
    isOrderModalOpen: false,
    isProductModalOpen: false,
    isSettingsModalOpen: false,
    activeTableId: null,
    activeOrderId: null,
    activeProductId: null,
    pendingSyncCount: 0,
};

export const useUIStore = create<UIState>()((set) => ({
    ...initialState,

    // Sidebar actions
    toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

    setSidebarOpen: (open) =>
        set({ sidebarOpen: open }),

    setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

    // Order modal actions
    openOrderModal: (orderId) =>
        set({
            isOrderModalOpen: true,
            activeOrderId: orderId || null,
        }),

    closeOrderModal: () =>
        set({
            isOrderModalOpen: false,
            activeOrderId: null,
        }),

    // Product modal actions
    openProductModal: (productId) =>
        set({
            isProductModalOpen: true,
            activeProductId: productId || null,
        }),

    closeProductModal: () =>
        set({
            isProductModalOpen: false,
            activeProductId: null,
        }),

    // Settings modal actions
    openSettingsModal: () =>
        set({ isSettingsModalOpen: true }),

    closeSettingsModal: () =>
        set({ isSettingsModalOpen: false }),

    // Selection actions
    setActiveTable: (tableId) =>
        set({ activeTableId: tableId }),

    setActiveOrder: (orderId) =>
        set({ activeOrderId: orderId }),

    // Sync count
    setPendingSyncCount: (count) =>
        set({ pendingSyncCount: count }),

    // Reset
    resetUI: () => set(initialState),
}));

// Selector hooks for optimized re-renders
export const useSidebarOpen = () => useUIStore((state) => state.sidebarOpen);
export const usePendingSyncCount = () => useUIStore((state) => state.pendingSyncCount);
export const useActiveTableId = () => useUIStore((state) => state.activeTableId);
export const useActiveOrderId = () => useUIStore((state) => state.activeOrderId);
