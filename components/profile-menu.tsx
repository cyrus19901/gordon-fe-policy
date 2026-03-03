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
import { useRouter } from "next/navigation"

interface ProfileMenuProps {
  onNavigateToSettings?: () => void
}

interface CurrentUser {
  id: string
  email: string
  name: string
}

export function ProfileMenu({ onNavigateToSettings }: ProfileMenuProps) {
  const router = useRouter()
  const [avatarUrl, setAvatarUrl] = useState<string>("/animated-avatar.gif")
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [connectedAccounts, setConnectedAccounts] = useState({
    linkedin: false,
    gmail: false,
  })

  useEffect(() => {
    // Fetch the current logged-in user from session
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(user => { if (user) setCurrentUser(user) })
      .catch(() => {})

    const storedLinkedin = localStorage.getItem("linkedin_connected")
    const storedGmail = localStorage.getItem("gmail_connected")
    const storedAvatar = localStorage.getItem("user_avatar")

    if (storedLinkedin === "true") setConnectedAccounts(prev => ({ ...prev, linkedin: true }))
    if (storedGmail === "true") setConnectedAccounts(prev => ({ ...prev, gmail: true }))
    if (storedAvatar) setAvatarUrl(storedAvatar)

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user_avatar" && e.newValue) setAvatarUrl(e.newValue)
      if (e.key === "linkedin_connected") setConnectedAccounts(prev => ({ ...prev, linkedin: e.newValue === "true" }))
      if (e.key === "gmail_connected") setConnectedAccounts(prev => ({ ...prev, gmail: e.newValue === "true" }))
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast.success("Logged out successfully")
      router.push('/auth/login')
    } catch {
      toast.error("Logout failed, please try again")
      setIsLoggingOut(false)
    }
  }

  // Build display name and initials from the real user
  const displayName = currentUser?.name
    ? currentUser.name.replace(/\b\w/g, l => l.toUpperCase())
    : currentUser?.email?.split('@')[0] ?? '…'

  const displayEmail = currentUser?.email ?? ''

  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('') || displayName[0]?.toUpperCase() || '?'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all">
          <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">{displayEmail}</p>
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
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          variant="destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? "Logging out…" : "Logout"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
