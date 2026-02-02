import { Database, Cloud, FileTextIcon, Folder, HardDrive } from "lucide-react"

// Layout constants
export const COLLAPSED_WIDTH = 400
export const EXPANDED_WIDTH = 640
export const EXPANDED_WIDE_WIDTH = 900 // wider panel when showing workflows via Zap
export const CAMPAIGN_DETAILS_WIDTH = 1100 // Extra wide for campaign workflow flowchart
export const MENU_CONTENT_HEIGHT = 500
export const OPEN_WIDE_HEIGHT = 760 // taller panel so more workflows are visible
export const CLOSED_BAR_HEIGHT = 52
export const INPUT_AREA_HEIGHT = 96
export const OPEN_BAR_HEIGHT = MENU_CONTENT_HEIGHT + INPUT_AREA_HEIGHT
export const EMAIL_DRAFT_HEIGHT = 550
export const LINKEDIN_DM_HEIGHT = 550 // Added LinkedIn DM height constant
export const CAMPAIGN_CREATION_HEIGHT = 700 // Increased height from 680 to 700 to prevent content cutoff
export const CAMPAIGN_DETAILS_HEIGHT = 700
export const NEW_DEAL_HEIGHT = 280
export const NEW_DEAL_UPLOAD_HEIGHT = 520
export const NEW_DEAL_DATA_ROOM_HEIGHT = 580
export const MARKET_DEAL_HEIGHT = 700
export const SEARCH_FILTER_HEIGHT = 480
export const MOBILE_CLOSED_BAR_HEIGHT = 54
export const MOBILE_INPUT_AREA_HEIGHT = 84
export const NAV_COLLAPSED_WIDTH = 320
export const NAV_COLLAPSED_HEIGHT = 48

// Animation variants
export const desktopBarVariants = {
  closed: { width: COLLAPSED_WIDTH, height: CLOSED_BAR_HEIGHT },
  open: { width: EXPANDED_WIDTH, height: OPEN_BAR_HEIGHT },
  open_wide: { width: EXPANDED_WIDE_WIDTH, height: OPEN_WIDE_HEIGHT },
  chat_view: { width: EXPANDED_WIDTH, height: INPUT_AREA_HEIGHT },
  email_draft: { width: EXPANDED_WIDE_WIDTH, height: EMAIL_DRAFT_HEIGHT },
  linkedin_dm: { width: EXPANDED_WIDE_WIDTH, height: LINKEDIN_DM_HEIGHT }, // Added LinkedIn DM animation variant
  campaign_creation: { width: EXPANDED_WIDE_WIDTH, height: CAMPAIGN_CREATION_HEIGHT }, // Added campaign creation animation variant
  campaign_details: { width: CAMPAIGN_DETAILS_WIDTH, height: CAMPAIGN_DETAILS_HEIGHT },
  bulk_campaign: { width: EXPANDED_WIDE_WIDTH, height: CAMPAIGN_CREATION_HEIGHT }, // Added bulk_campaign variant
  new_deal: { width: EXPANDED_WIDTH, height: NEW_DEAL_HEIGHT },
  new_deal_upload: { width: EXPANDED_WIDTH, height: NEW_DEAL_UPLOAD_HEIGHT },
  new_deal_data_room: { width: EXPANDED_WIDTH, height: NEW_DEAL_DATA_ROOM_HEIGHT },
  market_deal: { width: EXPANDED_WIDTH, height: MARKET_DEAL_HEIGHT },
  search_filter: { width: EXPANDED_WIDTH, height: SEARCH_FILTER_HEIGHT },
  signing_flow: { width: EXPANDED_WIDE_WIDTH, height: OPEN_WIDE_HEIGHT },
  bulk_actions: { width: EXPANDED_WIDTH, height: 46 }, // New bulk actions state
  nav_collapsed: {
    width: NAV_COLLAPSED_WIDTH,
    height: NAV_COLLAPSED_HEIGHT,
    borderRadius: "24px",
  },
  nav_expanded: {
    width: EXPANDED_WIDTH,
    height: CLOSED_BAR_HEIGHT,
    borderRadius: "16px",
  },
}

export const mobileBarVariants = {
  closed: { width: "calc(100vw - 24px)", height: MOBILE_CLOSED_BAR_HEIGHT },
  open: { width: "calc(100vw - 24px)", height: "min(70vh, 560px)" },
  open_wide: { width: "calc(100vw - 24px)", height: "min(80vh, 640px)" },
  chat_view: { width: "calc(100vw - 24px)", height: MOBILE_INPUT_AREA_HEIGHT },
  email_draft: { width: "calc(100vw - 24px)", height: "min(90vh, 720px)" },
  linkedin_dm: { width: "calc(100vw - 24px)", height: "min(90vh, 720px)" }, // Added LinkedIn DM mobile animation variant
  campaign_creation: { width: "calc(100vw - 24px)", height: "min(90vh, 750px)" }, // Added campaign creation mobile animation variant
  campaign_details: { width: "calc(100vw - 24px)", height: "min(90vh, 750px)" },
  bulk_campaign: { width: "calc(100vw - 24px)", height: "min(90vh, 750px)" }, // Added bulk_campaign mobile variant
  new_deal: { width: "calc(100vw - 24px)", height: "min(70vh, 520px)" },
  new_deal_upload: { width: "calc(100vw - 24px)", height: "min(85vh, 700px)" },
  new_deal_data_room: { width: "calc(100vw - 24px)", height: "min(85vh, 680px)" },
  market_deal: { width: "calc(100vw - 24px)", height: "min(85vh, 720px)" },
  search_filter: { width: "calc(100vw - 24px)", height: "min(85vh, 640px)" },
  signing_flow: { width: "calc(100vw - 24px)", height: "min(90vh, 800px)" },
  bulk_actions: { width: "calc(100vw - 24px)", height: 46 }, // New bulk actions state for mobile
  nav_collapsed: {
    width: "calc(100vw - 24px)",
    height: NAV_COLLAPSED_HEIGHT,
    borderRadius: "24px",
  },
  nav_expanded: {
    width: "calc(100vw - 24px)",
    height: MOBILE_CLOSED_BAR_HEIGHT,
    borderRadius: "16px",
  },
}

export const barTransition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 0.8,
  // Add specific transitions for border radius morphing
  borderRadius: { duration: 0.4, ease: "easeInOut" },
}

export const listVariants = {
  open: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
  closed: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
}

export const itemVariants = {
  open: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 350, damping: 25 } },
  closed: { y: 15, opacity: 0, transition: { type: "spring", stiffness: 400, damping: 30, mass: 0.6 } },
}

export const viewMotionVariants = {
  initial: { opacity: 0, x: 20 },
  enter: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2, ease: "easeIn" } },
}

export const fadeVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.2, delay: 0.1 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.1 } },
}

export const iconSwitchVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
}

// Mock data and constants
export const promptSuggestions = [
  "Compare to other deals",
  "Write in-depth analysis",
  "Use different data sources",
  "Make sure all assumptions are explicit",
]

export const dataRoomProviders = [
  {
    id: "sharepoint",
    name: "SharePoint",
    icon: Database,
    color: "bg-blue-500",
    description: "Microsoft SharePoint",
  },
  {
    id: "googledrive",
    name: "Google Drive",
    icon: Cloud,
    color: "bg-green-500",
    description: "Google Drive",
  },
  {
    id: "onenote",
    name: "OneNote",
    icon: FileTextIcon,
    color: "bg-purple-500",
    description: "Microsoft OneNote",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    icon: Folder,
    color: "bg-blue-600",
    description: "Dropbox",
  },
  {
    id: "onedrive",
    name: "OneDrive",
    icon: HardDrive,
    color: "bg-blue-400",
    description: "Microsoft OneDrive",
  },
]

export const mockDataFiles = [
  { name: "Financial Statements 2023.xlsx", size: "2.4 MB", type: "spreadsheet" },
  { name: "Due Diligence Checklist.pdf", size: "1.8 MB", type: "document" },
  { name: "Market Analysis Report.docx", size: "3.2 MB", type: "document" },
  { name: "Legal Documents Folder", size: "15.6 MB", type: "folder" },
  { name: "Management Presentations", size: "8.9 MB", type: "folder" },
  { name: "Customer Contracts", size: "12.3 MB", type: "folder" },
  { name: "Audit Reports 2022-2023", size: "5.7 MB", type: "folder" },
  { name: "IP Portfolio Documentation", size: "4.1 MB", type: "folder" },
]

// Utility functions
export const getHealthColor = (health: number) => {
  if (health > 80) return "bg-green-500"
  if (health > 60) return "bg-yellow-500"
  return "bg-red-500"
}

export const getCreditScoreColor = (score: string) => {
  if (score.startsWith("A")) return "text-green-600 bg-green-50"
  if (score.startsWith("B")) return "text-yellow-600 bg-yellow-50"
  return "text-red-600 bg-red-50"
}

// New utility function for formatting file sizes
export const formatFileSize = (size: number) => {
  const units = ["bytes", "KB", "MB", "GB", "TB"]
  let i = 0
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(2)} ${units[i]}`
}
