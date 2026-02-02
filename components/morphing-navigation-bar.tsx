"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Home, Settings, CreditCard, Mail, Bot, Link2, Compass, List, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { barTransition } from "./floating-chat-constants"

const navigationItems = [
  { icon: Home, href: "/", label: "Overview", key: "home" },
  { icon: ShieldCheck, href: "/policy-builder", label: "Policy Builder", key: "find-deals" },
  { icon: Bot, href: "/agents", label: "Agents", key: "watchlist" },
  { icon: Mail, href: "/inbox", label: "Inbox", key: "inbox" },
  { icon: Settings, href: "/settings", label: "Settings", key: "settings" },
]

interface MorphingNavigationBarProps {
  isExpanded: boolean
  onNavigate: (key: string) => void
  onSearchClick: () => void
  onExpandToggle: (expanded: boolean) => void
  currentSection?: string
  searchQuery?: string
  onSearchQueryChange?: (query: string) => void
  onSearchSubmit?: () => void
  placeholder?: string
}

export function MorphingNavigationBar({
  isExpanded,
  onNavigate,
  onSearchClick,
  onExpandToggle,
  currentSection = "home",
  searchQuery = "",
  onSearchQueryChange,
  onSearchSubmit,
  placeholder = "Search or ask anything...",
}: MorphingNavigationBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  const handleSearchClick = () => {
    if (!isExpanded) {
      onExpandToggle(true)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 150)
    }
    onSearchClick()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSearchSubmit?.()
    }
    if (e.key === "Escape") {
      onExpandToggle(false)
      inputRef.current?.blur()
    }
  }

  const handleInputFocus = () => {
    setIsFocused(true)
    if (!isExpanded) {
      onExpandToggle(true)
    }
  }

  const handleInputBlur = () => {
    setIsFocused(false)
  }

  return (
    <motion.div
      layout
      variants={{
        collapsed: {
          width: "auto",
          height: 48,
          borderRadius: 24,
        },
        expanded: {
          width: 420,
          height: 52,
          borderRadius: 16,
        },
      }}
      initial="collapsed"
      animate={isExpanded ? "expanded" : "collapsed"}
      transition={barTransition}
      className={cn(
        "relative overflow-hidden text-foreground flex items-center",
        isExpanded
          ? "bg-white/80 backdrop-blur-xl shadow-2xl border border-white/20"
          : "bg-white/10 backdrop-blur-md shadow-lg border border-white/20",
      )}
    >
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center w-full h-full px-4"
          >
            <div className="flex items-center space-x-2 flex-1">
              {navigationItems.map((item) => (
                <motion.button
                  key={item.key}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200",
                    currentSection === item.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigate(item.key)}
                  title={item.label}
                >
                  <item.icon className="h-4 w-4" />
                </motion.button>
              ))}
            </div>

            <div className="flex-1 mx-4">
              <Input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => onSearchQueryChange?.(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                className="w-full h-8 bg-transparent border-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-slate-500 text-slate-900"
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center h-full w-full"
          >
            <div className="flex items-center space-x-4">
              {navigationItems.map((item, index) => (
                <motion.button
                  key={item.key}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200",
                    currentSection === item.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: { delay: index * 0.05 },
                  }}
                  onClick={() => onNavigate(item.key)}
                  title={item.label}
                >
                  <item.icon className="h-4 w-4" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
