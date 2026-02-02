"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, LogOut, Linkedin, Mail, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { useState, useEffect } from "react"

interface ProfileMenuProps {
  onNavigateToSettings?: () => void
}

export function ProfileMenu({ onNavigateToSettings }: ProfileMenuProps) {
  const [avatarUrl, setAvatarUrl] = useState<string>("/animated-avatar.gif")
  const [connectedAccounts, setConnectedAccounts] = useState({
    linkedin: false,
    gmail: false,
  })

  // Load connected accounts and avatar from localStorage on mount
  useEffect(() => {
    const storedLinkedin = localStorage.getItem("linkedin_connected")
    const storedGmail = localStorage.getItem("gmail_connected")
    const storedAvatar = localStorage.getItem("user_avatar")

    if (storedLinkedin === "true") {
      setConnectedAccounts((prev) => ({ ...prev, linkedin: true }))
    }
    if (storedGmail === "true") {
      setConnectedAccounts((prev) => ({ ...prev, gmail: true }))
    }
    if (storedAvatar) {
      setAvatarUrl(storedAvatar)
    }

    // Listen for storage changes to sync avatar across tabs/components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user_avatar" && e.newValue) {
        setAvatarUrl(e.newValue)
      }
      if (e.key === "linkedin_connected") {
        setConnectedAccounts((prev) => ({ ...prev, linkedin: e.newValue === "true" }))
      }
      if (e.key === "gmail_connected") {
        setConnectedAccounts((prev) => ({ ...prev, gmail: e.newValue === "true" }))
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])
  // </CHANGE>

  const handleLogout = () => {
    toast.success("Logged out successfully")
    // TODO: Implement actual logout logic when auth is added
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all">
          <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarImage src={avatarUrl || "/placeholder.svg"} alt="User avatar" />
            <AvatarFallback>E</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">Eduardo</p>
            <p className="text-xs text-muted-foreground">eduardo@company.com</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="px-2 py-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">Connected Accounts</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Linkedin className="h-3.5 w-3.5 text-[#0A66C2]" />
                <span>LinkedIn</span>
              </div>
              {connectedAccounts.linkedin ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[#EA4335]" />
                <span>Gmail</span>
              </div>
              {connectedAccounts.gmail ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
              )}
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onNavigateToSettings}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} variant="destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
