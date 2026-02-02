"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { BookmarkPlus, Check, Plus, Folder, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSavedDeals } from "@/lib/saved-deals-context"

interface SaveDealDropdownProps {
  deal: any
  onSave?: (listId: string) => void
  className?: string
}

export function SaveDealDropdown({ deal, onSave, className }: SaveDealDropdownProps) {
  const { state, dispatch } = useSavedDeals()
  const [isOpen, setIsOpen] = useState(false)
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [selectedColor, setSelectedColor] = useState("blue")

  const colors = [
    { id: "blue", name: "Blue", class: "bg-blue-500" },
    { id: "red", name: "Red", class: "bg-red-500" },
    { id: "green", name: "Green", class: "bg-green-500" },
    { id: "yellow", name: "Yellow", class: "bg-yellow-500" },
    { id: "purple", name: "Purple", class: "bg-purple-500" },
    { id: "gray", name: "Gray", class: "bg-gray-500" },
  ]

  const isAlreadySaved = state.savedDeals.some((savedDeal) => savedDeal.name === deal.name)

  const handleSaveToDeal = (listId: string) => {
    dispatch({ type: "SAVE_DEAL", payload: { deal, listId } })
    onSave?.(listId)
    setIsOpen(false)
  }

  const handleCreateList = () => {
    if (newListName.trim()) {
      dispatch({
        type: "CREATE_LIST",
        payload: {
          name: newListName.trim(),
          color: selectedColor,
        },
      })
      setNewListName("")
      setIsCreatingList(false)
    }
  }

  if (isAlreadySaved) {
    return (
      <Button variant="outline" size="sm" disabled className={cn("h-8 px-3 text-xs", className)}>
        <Check className="h-3 w-3 mr-1.5 text-green-500" />
        Saved
      </Button>
    )
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-3 text-xs hover:bg-secondary border-border/60 hover:border-border"
      >
        <BookmarkPlus className="h-3 w-3 mr-1.5" />
        Save
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              className="absolute top-full right-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden"
            >
              <div className="p-3">
                <div className="flex items-center space-x-2 mb-3">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Save to list</span>
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {state.dealLists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => handleSaveToDeal(list.id)}
                      className="w-full flex items-center justify-between p-2 rounded-md text-sm hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <div className={cn("w-2 h-2 rounded-full", `bg-${list.color}-500`)} />
                        <Folder className="h-3 w-3 text-muted-foreground" />
                        <span>{list.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {list.dealCount}
                      </Badge>
                    </button>
                  ))}
                </div>

                <Separator className="my-3" />

                {!isCreatingList ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreatingList(true)}
                    className="w-full justify-start h-8 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    Create new list
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Input
                      placeholder="List name"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="h-8 text-xs"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateList()
                        if (e.key === "Escape") setIsCreatingList(false)
                      }}
                    />

                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-muted-foreground mr-2">Color:</span>
                      {colors.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => setSelectedColor(color.id)}
                          className={cn(
                            "w-4 h-4 rounded-full border-2 transition-all",
                            color.class,
                            selectedColor === color.id ? "border-foreground scale-110" : "border-transparent",
                          )}
                        />
                      ))}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCreatingList(false)}
                        className="h-7 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCreateList}
                        disabled={!newListName.trim()}
                        className="h-7 text-xs"
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
