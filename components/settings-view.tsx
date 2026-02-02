"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Shield, Palette, Link2, CheckCircle2, XCircle, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function SettingsView() {
  const { toast } = useToast()
  const [avatarUrl, setAvatarUrl] = useState<string>("/animated-avatar.gif")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [settings, setSettings] = useState({
    // Profile
    name: "Eduardo",
    email: "eduardo@company.com",
    company: "Investment Partners LLC",

    // Preferences
    darkMode: false,
    autoSave: true,
    defaultView: "your-deals",

    // Privacy
    profileVisible: true,
    activityTracking: true,
  })

  const [connectedAccounts, setConnectedAccounts] = useState({
    linkedin: false,
    gmail: false,
  })

  const [gmailEmail, setGmailEmail] = useState<string | null>(null)
  const [linkedinProfile, setLinkedinProfile] = useState<string | null>(null)
  const [showGmailDialog, setShowGmailDialog] = useState(false)
  const [gmailAuthStep, setGmailAuthStep] = useState<"consent" | "success">("consent")

  useEffect(() => {
    const storedLinkedin = localStorage.getItem("linkedin_connected")
    const storedGmail = localStorage.getItem("gmail_connected")
    const storedGmailEmail = localStorage.getItem("gmail_email")
    const storedLinkedinProfile = localStorage.getItem("linkedin_profile")
    const storedAvatar = localStorage.getItem("user_avatar")

    if (storedLinkedin === "true") {
      setConnectedAccounts((prev) => ({ ...prev, linkedin: true }))
      setLinkedinProfile(storedLinkedinProfile)
    }
    if (storedGmail === "true") {
      setConnectedAccounts((prev) => ({ ...prev, gmail: true }))
      setGmailEmail(storedGmailEmail)
    }
    if (storedAvatar) {
      setAvatarUrl(storedAvatar)
    }
  }, [])

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleConnectGmail = () => {
    setShowGmailDialog(true)
    setGmailAuthStep("consent")
  }

  const handleGmailConsent = () => {
    setGmailAuthStep("success")

    setTimeout(() => {
      const mockEmail = "eduardo@gmail.com"
      setConnectedAccounts((prev) => ({ ...prev, gmail: true }))
      setGmailEmail(mockEmail)

      localStorage.setItem("gmail_connected", "true")
      localStorage.setItem("gmail_email", mockEmail)

      toast({
        title: "Gmail Connected",
        description: "Your Gmail account has been successfully connected.",
      })

      setShowGmailDialog(false)
    }, 1500)
  }

  const handleDisconnectGmail = () => {
    setConnectedAccounts((prev) => ({ ...prev, gmail: false }))
    setGmailEmail(null)

    localStorage.removeItem("gmail_connected")
    localStorage.removeItem("gmail_email")

    toast({
      title: "Gmail Disconnected",
      description: "Your Gmail account has been disconnected.",
    })
  }

  const handleConnectAccount = (platform: "linkedin" | "gmail") => {
    if (platform === "gmail") {
      handleConnectGmail()
      return
    }

    toast({
      title: `Connecting ${platform === "linkedin" ? "LinkedIn" : "Gmail"}...`,
      description: "Opening authentication window...",
    })

    setTimeout(() => {
      const mockProfile = "Eduardo Silva"
      setConnectedAccounts((prev) => ({ ...prev, [platform]: true }))
      setLinkedinProfile(mockProfile)

      localStorage.setItem("linkedin_connected", "true")
      localStorage.setItem("linkedin_profile", mockProfile)

      toast({
        title: "Account Connected",
        description: `Your ${platform === "linkedin" ? "LinkedIn" : "Gmail"} account has been successfully connected.`,
      })
    }, 1500)
  }

  const handleDisconnectAccount = (platform: "linkedin" | "gmail") => {
    if (platform === "gmail") {
      handleDisconnectGmail()
      return
    }

    setConnectedAccounts((prev) => ({ ...prev, [platform]: false }))
    setLinkedinProfile(null)

    localStorage.removeItem("linkedin_connected")
    localStorage.removeItem("linkedin_profile")

    toast({
      title: "Account Disconnected",
      description: `Your ${platform === "linkedin" ? "LinkedIn" : "Gmail"} account has been disconnected.`,
    })
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 2MB.",
          variant: "destructive",
        })
        return
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select a JPG or PNG image.",
          variant: "destructive",
        })
        return
      }

      // Read and store the image
      const reader = new FileReader()
      reader.onloadend = () => {
        const imageUrl = reader.result as string
        setAvatarUrl(imageUrl)
        localStorage.setItem("user_avatar", imageUrl)

        toast({
          title: "Avatar Updated",
          description: "Your profile photo has been changed successfully.",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleChangePhotoClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4 px-4">
      <Dialog open={showGmailDialog} onOpenChange={setShowGmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Connect Gmail Account
            </DialogTitle>
            <DialogDescription>
              {gmailAuthStep === "consent"
                ? "Grant Gordon AI access to send emails on your behalf"
                : "Successfully authenticated!"}
            </DialogDescription>
          </DialogHeader>

          {gmailAuthStep === "consent" ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border/50 p-4 bg-muted/30">
                <p className="text-sm font-medium mb-3">Gordon AI will be able to:</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Send emails on your behalf for campaigns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Read email responses and track engagement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Manage email templates and signatures</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowGmailDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleGmailConsent} className="flex-1">
                  Allow Access
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground">Connecting your account...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* </CHANGE> */}

      {/* Settings Sections */}
      <div className="grid gap-8 py-6">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-border/30">
              <User className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-base font-semibold">Profile</h3>
            </div>
            <div className="space-y-3 pl-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={avatarUrl || "/placeholder.svg"} alt="Profile" />
                  <AvatarFallback className="text-sm">E</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs bg-transparent"
                    onClick={handleChangePhotoClick}
                  >
                    Change Photo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => handleSettingChange("name", e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleSettingChange("email", e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="company" className="text-xs font-medium">
                    Company
                  </Label>
                  <Input
                    id="company"
                    value={settings.company}
                    onChange={(e) => handleSettingChange("company", e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-border/30">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-base font-semibold">Connected Accounts</h3>
            </div>
            <div className="space-y-4 pl-6">
              {/* LinkedIn Connection */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/30">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-[#0A66C2] flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">LinkedIn</p>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      {connectedAccounts.linkedin ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          <p className="text-xs text-green-600">{linkedinProfile || "Connected"}</p>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Not connected</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {connectedAccounts.linkedin ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnectAccount("linkedin")}
                    className="h-8 text-xs"
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleConnectAccount("linkedin")}
                    className="h-8 text-xs"
                  >
                    Connect
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/30">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center border border-border/50">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M5 5v14h14V5H5zm13 13H6V6h12v12z" />
                      <path fill="#FBBC05" d="M5 5l7 7-7 7V5z" />
                      <path fill="#34A853" d="M19 5l-7 7 7 7V5z" />
                      <path fill="#4285F4" d="M5 5l7 7 7-7H5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Gmail</p>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      {connectedAccounts.gmail ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          <p className="text-xs text-green-600">{gmailEmail || "Connected"}</p>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Not connected</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {connectedAccounts.gmail ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnectGmail}
                    className="h-8 text-xs bg-transparent"
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button variant="default" size="sm" onClick={handleConnectGmail} className="h-8 text-xs">
                    Connect
                  </Button>
                )}
              </div>
              {/* </CHANGE> */}

              <p className="text-xs text-muted-foreground pt-2">
                Connect your accounts to enable automated outreach and campaign management.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Preferences Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-border/30">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-base font-semibold">Preferences</h3>
            </div>
            <div className="space-y-4 pl-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Use dark theme</p>
                </div>
                <Switch
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => handleSettingChange("darkMode", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Auto Save</p>
                  <p className="text-xs text-muted-foreground">Automatically save your work</p>
                </div>
                <Switch
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => handleSettingChange("autoSave", checked)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Default View</Label>
                <div className="flex space-x-2">
                  <Button
                    variant={settings.defaultView === "your-deals" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSettingChange("defaultView", "your-deals")}
                    className="h-8 text-xs"
                  >
                    Your Deals
                  </Button>
                  <Button
                    variant={settings.defaultView === "find-deals" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSettingChange("defaultView", "find-deals")}
                    className="h-8 text-xs"
                  >
                    Find Deals
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Privacy Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-border/30">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-base font-semibold">Privacy & Security</h3>
            </div>
            <div className="space-y-4 pl-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Profile Visibility</p>
                  <p className="text-xs text-muted-foreground">Make your profile visible to others</p>
                </div>
                <Switch
                  checked={settings.profileVisible}
                  onCheckedChange={(checked) => handleSettingChange("profileVisible", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Activity Tracking</p>
                  <p className="text-xs text-muted-foreground">Help improve our service</p>
                </div>
                <Switch
                  checked={settings.activityTracking}
                  onCheckedChange={(checked) => handleSettingChange("activityTracking", checked)}
                />
              </div>

              <div className="pt-3 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Danger Zone</p>
                    <p className="text-xs text-muted-foreground">Irreversible actions</p>
                  </div>
                  <Button variant="destructive" size="sm" className="h-8 text-xs">
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
