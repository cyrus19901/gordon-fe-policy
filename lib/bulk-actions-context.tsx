"use client"

import type React from "react"
import { createContext, useContext, useReducer, type ReactNode } from "react"

interface BulkActionsState {
  selectedDeals: any[]
  isSelectionMode: boolean
  bulkActionType: "email" | "save" | "export" | null
}

type BulkActionsAction =
  | { type: "TOGGLE_DEAL_SELECTION"; payload: any }
  | { type: "SELECT_ALL_DEALS"; payload: any[] }
  | { type: "CLEAR_SELECTION" }
  | { type: "SET_SELECTION_MODE"; payload: boolean }
  | { type: "SET_BULK_ACTION_TYPE"; payload: "email" | "save" | "export" | null }

const initialState: BulkActionsState = {
  selectedDeals: [],
  isSelectionMode: false,
  bulkActionType: null,
}

function bulkActionsReducer(state: BulkActionsState, action: BulkActionsAction): BulkActionsState {
  switch (action.type) {
    case "TOGGLE_DEAL_SELECTION": {
      const deal = action.payload
      const isSelected = state.selectedDeals.some((d) => d.id === deal.id)

      if (isSelected) {
        return {
          ...state,
          selectedDeals: state.selectedDeals.filter((d) => d.id !== deal.id),
        }
      } else {
        return {
          ...state,
          selectedDeals: [...state.selectedDeals, deal],
        }
      }
    }

    case "SELECT_ALL_DEALS": {
      const allDeals = action.payload
      const allSelected = allDeals.every((deal) => state.selectedDeals.some((selected) => selected.id === deal.id))

      if (allSelected) {
        // Deselect all
        return {
          ...state,
          selectedDeals: state.selectedDeals.filter((selected) => !allDeals.some((deal) => deal.id === selected.id)),
        }
      } else {
        // Select all
        const newSelections = allDeals.filter(
          (deal) => !state.selectedDeals.some((selected) => selected.id === deal.id),
        )
        return {
          ...state,
          selectedDeals: [...state.selectedDeals, ...newSelections],
        }
      }
    }

    case "CLEAR_SELECTION":
      return {
        ...state,
        selectedDeals: [],
        isSelectionMode: false,
        bulkActionType: null,
      }

    case "SET_SELECTION_MODE":
      return {
        ...state,
        isSelectionMode: action.payload,
        // Selection should only be cleared via CLEAR_SELECTION action
      }

    case "SET_BULK_ACTION_TYPE":
      return {
        ...state,
        bulkActionType: action.payload,
      }

    default:
      return state
  }
}

const BulkActionsContext = createContext<{
  state: BulkActionsState
  dispatch: React.Dispatch<BulkActionsAction>
} | null>(null)

export function BulkActionsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bulkActionsReducer, initialState)

  return <BulkActionsContext.Provider value={{ state, dispatch }}>{children}</BulkActionsContext.Provider>
}

export function useBulkActions() {
  const context = useContext(BulkActionsContext)
  if (!context) {
    throw new Error("useBulkActions must be used within a BulkActionsProvider")
  }
  return context
}
