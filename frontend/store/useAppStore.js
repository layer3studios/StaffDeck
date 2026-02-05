import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
    persist(
        (set, get) => ({
            // Theme
            theme: 'system',
            setTheme: (theme) => set({ theme }),

            // Sidebar
            isSidebarCollapsed: false,
            isMobileSidebarOpen: false,
            toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
            toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
            closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),

            // Privacy Mode
            isPrivacyMode: false,
            togglePrivacyMode: () => set((state) => ({ isPrivacyMode: !state.isPrivacyMode })),

            // Team Table
            teamTable: {
                search: '',
                departmentFilter: null,
                statusFilter: null,
                sortBy: 'name',
                sortDesc: false,
                pageIndex: 0,
                pageSize: 20,
                rowSelection: {}
            },
            setTeamSearch: (search) => set((state) => ({
                teamTable: { ...state.teamTable, search, pageIndex: 0 }
            })),
            setTeamDepartmentFilter: (departmentFilter) => set((state) => ({
                teamTable: { ...state.teamTable, departmentFilter, pageIndex: 0 }
            })),
            setTeamStatusFilter: (statusFilter) => set((state) => ({
                teamTable: { ...state.teamTable, statusFilter, pageIndex: 0 }
            })),
            setTeamSort: (sortBy, sortDesc) => set((state) => ({
                teamTable: { ...state.teamTable, sortBy, sortDesc }
            })),
            setTeamPageIndex: (pageIndex) => set((state) => ({
                teamTable: { ...state.teamTable, pageIndex }
            })),
            setTeamPageSize: (pageSize) => set((state) => ({
                teamTable: { ...state.teamTable, pageSize, pageIndex: 0 }
            })),
            setTeamRowSelection: (rowSelection) => set((state) => ({
                teamTable: { ...state.teamTable, rowSelection }
            })),
            clearTeamFilters: () => set((state) => ({
                teamTable: {
                    ...state.teamTable,
                    search: '',
                    departmentFilter: null,
                    statusFilter: null,
                    pageIndex: 0
                }
            })),

            // Employee Sheet
            employeeSheet: {
                isOpen: false,
                activeEmployeeId: null,
                activeTab: 'Overview'
            },
            openEmployeeSheet: (employeeId) => set({
                employeeSheet: { isOpen: true, activeEmployeeId: employeeId, activeTab: 'Overview' }
            }),
            closeEmployeeSheet: () => set({
                employeeSheet: { isOpen: false, activeEmployeeId: null, activeTab: 'Overview' }
            }),
            setEmployeeSheetTab: (tab) => set((state) => ({
                employeeSheet: { ...state.employeeSheet, activeTab: tab }
            })),

            // Global Search
            isSearchOpen: false,
            openSearch: () => set({ isSearchOpen: true }),
            closeSearch: () => set({ isSearchOpen: false }),
        }),
        {
            name: 'staffdeck-storage',
            partialize: (state) => ({
                isPrivacyMode: state.isPrivacyMode,
                isSidebarCollapsed: state.isSidebarCollapsed,
                teamTable: {
                    pageSize: state.teamTable.pageSize
                }
            }),
            merge: (persistedState, currentState) => {
                return {
                    ...currentState,
                    ...persistedState,
                    teamTable: {
                        ...currentState.teamTable,
                        ...(persistedState.teamTable || {})
                    }
                }
            }
        }
    )
)
