"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  ChevronDown,
  Calendar,
  Plane,
  Car,
  RefreshCw,
  CheckCircle2,
  Link2,
} from "lucide-react"

interface Invoice {
  id: string
  vendor: string
  vendorEmail: string
  vendorLogo: "expedia" | "avis"
  amount: string
  dueDate: string
  invoiceNumber: string
  invoiceDate: string
  description: string
  lineItems: {
    item: string
    quantity: number
    rate: string
    amount: string
  }[]
  subtotal: string
  tax: string
  total: string
}

const mockInvoices: Invoice[] = [
  {
    id: "1",
    vendor: "Expedia",
    vendorEmail: "billing@expedia.com",
    vendorLogo: "expedia",
    amount: "$1,247.50",
    dueDate: "Nov 15, 2024",
    invoiceNumber: "EXP-HTL-892341",
    invoiceDate: "Oct 28, 2024",
    description: "Hotel accommodation for client meeting in San Francisco - 3 nights at Marriott Union Square",
    lineItems: [
      { item: "Deluxe King Room - Nov 12", quantity: 1, rate: "$389.00", amount: "$389.00" },
      { item: "Deluxe King Room - Nov 13", quantity: 1, rate: "$389.00", amount: "$389.00" },
      { item: "Deluxe King Room - Nov 14", quantity: 1, rate: "$389.00", amount: "$389.00" },
    ],
    subtotal: "$1,167.00",
    tax: "$80.50",
    total: "$1,247.50",
  },
  {
    id: "2",
    vendor: "Avis",
    vendorEmail: "invoices@avis.com",
    vendorLogo: "avis",
    amount: "$342.18",
    dueDate: "Nov 10, 2024",
    invoiceNumber: "AVIS-RNT-445892",
    invoiceDate: "Oct 25, 2024",
    description: "Vehicle rental for regional office visits - Compact SUV for 4 days",
    lineItems: [
      { item: "Compact SUV - Daily Rate", quantity: 4, rate: "$68.00", amount: "$272.00" },
      { item: "Insurance Coverage", quantity: 4, rate: "$12.00", amount: "$48.00" },
    ],
    subtotal: "$320.00",
    tax: "$22.18",
    total: "$342.18",
  },
]

export function InvoicesView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("1")
  const [showMissingInfo, setShowMissingInfo] = useState(true)
  const [selectedErp, setSelectedErp] = useState<string>("")
  const [syncStatus, setSyncStatus] = useState<Record<string, "idle" | "syncing" | "synced">>({})
  const [isSyncingAll, setIsSyncingAll] = useState(false)

  const erpSystems = [
    { id: "quickbooks", name: "QuickBooks", icon: "QB" },
    { id: "netsuite", name: "NetSuite", icon: "NS" },
    { id: "sap", name: "SAP", icon: "SAP" },
    { id: "xero", name: "Xero", icon: "X" },
    { id: "sage", name: "Sage", icon: "SG" },
  ]

  const costCenters = [
    { id: "cc-100", name: "CC-100 Operations", department: "Operations" },
    { id: "cc-200", name: "CC-200 Sales & Marketing", department: "Sales" },
    { id: "cc-300", name: "CC-300 Engineering", department: "Engineering" },
    { id: "cc-400", name: "CC-400 Travel & Expenses", department: "Travel" },
    { id: "cc-500", name: "CC-500 Administration", department: "Admin" },
  ]

  const [selectedCostCenter, setSelectedCostCenter] = useState<string>("")

  const handleSyncInvoice = async (invoiceId: string) => {
    if (!selectedErp) return
    setSyncStatus((prev) => ({ ...prev, [invoiceId]: "syncing" }))
    // Simulate sync delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setSyncStatus((prev) => ({ ...prev, [invoiceId]: "synced" }))
  }

  const handleSyncAll = async () => {
    if (!selectedErp) return
    setIsSyncingAll(true)
    for (const invoice of mockInvoices) {
      setSyncStatus((prev) => ({ ...prev, [invoice.id]: "syncing" }))
      await new Promise((resolve) => setTimeout(resolve, 800))
      setSyncStatus((prev) => ({ ...prev, [invoice.id]: "synced" }))
    }
    setIsSyncingAll(false)
  }

  const selectedInvoice = mockInvoices.find((inv) => inv.id === selectedInvoiceId) || mockInvoices[0]

  const filteredInvoices = mockInvoices.filter((invoice) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        invoice.vendor.toLowerCase().includes(query) ||
        invoice.invoiceNumber.toLowerCase().includes(query)
      )
    }
    return true
  })

  const VendorLogo = ({ vendor }: { vendor: "expedia" | "avis" }) => {
    if (vendor === "expedia") {
      return (
        <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center">
          <Plane className="h-4 w-4 text-yellow-900" />
        </div>
      )
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
        <Car className="h-4 w-4 text-white" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-background rounded-lg border border-border overflow-hidden">
      {/* Top ERP Sync Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <span className="font-medium text-foreground">ERP Integration</span>
          </div>
          <Select value={selectedErp} onValueChange={setSelectedErp}>
            <SelectTrigger className="w-48 h-10 bg-background">
              <SelectValue placeholder="Select ERP system" />
            </SelectTrigger>
            <SelectContent>
              {erpSystems.map((erp) => (
                <SelectItem key={erp.id} value={erp.id}>
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded bg-muted flex items-center justify-center text-xs font-bold">
                      {erp.icon}
                    </span>
                    {erp.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedErp && (
            <>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Cost Center:</span>
                <Select value={selectedCostCenter} onValueChange={setSelectedCostCenter}>
                  <SelectTrigger className="w-56 h-10 bg-background">
                    <SelectValue placeholder="Select cost center" />
                  </SelectTrigger>
                  <SelectContent>
                    {costCenters.map((cc) => (
                      <SelectItem key={cc.id} value={cc.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{cc.name}</span>
                          <span className="text-xs text-muted-foreground">{cc.department}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
        {selectedErp && selectedCostCenter && (
          <Button
            size="lg"
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="h-10 px-6"
          >
            {isSyncingAll ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing All Invoices...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync All to {erpSystems.find((e) => e.id === selectedErp)?.name}
              </>
            )}
          </Button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Invoice List */}
        <div className="w-72 border-r border-border flex flex-col bg-muted/20">
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search bills"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm bg-background"
              />
            </div>
          </div>

          {/* Invoice List Section */}
          <div className="flex-1 overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowMissingInfo(!showMissingInfo)}
              className="w-full px-3 py-2 flex items-center gap-2 text-sm font-medium text-foreground hover:bg-muted/50"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showMissingInfo ? "" : "-rotate-90"}`} />
              All Bills
            </button>

            <AnimatePresence initial={false}>
              {showMissingInfo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {filteredInvoices.map((invoice) => (
                    <button
                      type="button"
                      key={invoice.id}
                      onClick={() => setSelectedInvoiceId(invoice.id)}
                      className={`w-full text-left px-3 py-3 border-l-2 transition-colors ${
                        selectedInvoiceId === invoice.id
                          ? "border-l-primary bg-muted/50"
                          : "border-l-transparent hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <VendorLogo vendor={invoice.vendorLogo} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-foreground truncate">{invoice.vendor}</p>
                            {syncStatus[invoice.id] === "synced" && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                            )}
                            {syncStatus[invoice.id] === "syncing" && (
                              <RefreshCw className="h-3.5 w-3.5 text-blue-500 animate-spin flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {invoice.amount} · Due {invoice.dueDate}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Middle Panel - Bill Details */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-2xl">
            {/* Title */}
            <p className="text-sm text-muted-foreground mb-1">Draft</p>
            <h1 className="text-2xl font-semibold text-foreground mb-6">
              {selectedInvoice.vendor} INV# {selectedInvoice.invoiceNumber}
            </h1>

            {/* Vendor Section */}
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-base font-medium text-foreground">Vendor</h2>
                <Badge className="bg-green-100 text-green-700 border-0 text-xs font-normal">Complete</Badge>
              </div>
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <VendorLogo vendor={selectedInvoice.vendorLogo} />
                  <div>
                    <p className="font-medium text-foreground">{selectedInvoice.vendor}</p>
                    <p className="text-sm text-muted-foreground">{selectedInvoice.vendorEmail} · No previous payments</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ERP Sync Status */}
            {selectedErp && (
              <section className="mb-6">
                <div className="border border-border rounded-lg bg-muted/30 overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
                        <span className="text-xs font-bold text-foreground">
                          {erpSystems.find((e) => e.id === selectedErp)?.icon}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {erpSystems.find((e) => e.id === selectedErp)?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {syncStatus[selectedInvoice.id] === "synced"
                            ? "Synced successfully"
                            : syncStatus[selectedInvoice.id] === "syncing"
                              ? "Syncing..."
                              : "Not synced"}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={syncStatus[selectedInvoice.id] === "synced" ? "outline" : "default"}
                      onClick={() => handleSyncInvoice(selectedInvoice.id)}
                      disabled={syncStatus[selectedInvoice.id] === "syncing" || !selectedCostCenter}
                      className={syncStatus[selectedInvoice.id] === "synced" ? "bg-transparent" : ""}
                    >
                      {syncStatus[selectedInvoice.id] === "syncing" ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          Syncing
                        </>
                      ) : syncStatus[selectedInvoice.id] === "synced" ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                          Synced
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                          Sync to ERP
                        </>
                      )}
                    </Button>
                  </div>
                  {selectedCostCenter && (
                    <div className="px-4 py-3 border-t border-border bg-background/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Syncing to:</span>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {costCenters.find((cc) => cc.id === selectedCostCenter)?.name}
                        </Badge>
                      </div>
                    </div>
                  )}
                  {!selectedCostCenter && (
                    <div className="px-4 py-3 border-t border-border bg-amber-50 dark:bg-amber-950/20">
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Please select a cost center from the top bar to enable syncing
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Bill Details Section */}
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-base font-medium text-foreground">Bill details</h2>
                <Badge className="bg-green-100 text-green-700 border-0 text-xs font-normal">Complete</Badge>
              </div>
              <div className="space-y-4">
                <div className="border border-border rounded-lg p-4">
                  <label className="text-xs text-muted-foreground">Invoice #</label>
                  <p className="font-medium text-foreground"># {selectedInvoice.invoiceNumber}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-border rounded-lg p-4">
                    <label className="text-xs text-muted-foreground">Invoice date</label>
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{selectedInvoice.invoiceDate}</p>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-4">
                    <label className="text-xs text-muted-foreground">Due date</label>
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{selectedInvoice.dueDate}</p>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <label className="text-xs text-muted-foreground">Description</label>
                  <p className="text-foreground">{selectedInvoice.description}</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Right Panel - Invoice Preview */}
        <div className="w-80 border-l border-border bg-muted/20 flex flex-col">
          {/* Tabs */}
          <div className="border-b border-border px-4">
            <div className="flex gap-6">
              <button type="button" className="py-3 text-sm font-medium text-foreground border-b-2 border-foreground">
                Invoice
              </button>
              <button type="button" className="py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
                Documents
              </button>
            </div>
          </div>

          {/* Invoice Document Preview */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="bg-white dark:bg-card rounded-lg border border-border shadow-sm overflow-hidden">
              {/* Invoice Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <VendorLogo vendor={selectedInvoice.vendorLogo} />
                    <span className="font-bold text-foreground">{selectedInvoice.vendor.toUpperCase()}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-muted-foreground">INVOICE</p>
                    <p className="text-xs text-muted-foreground"># {selectedInvoice.invoiceNumber}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-muted-foreground mb-1">{selectedInvoice.vendor}</p>
                    <p className="text-muted-foreground">Corporate Billing</p>
                    <p className="text-muted-foreground">United States</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="text-foreground">{selectedInvoice.invoiceDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span className="text-foreground">{selectedInvoice.dueDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance Due */}
              <div className="px-4 py-2 bg-[#c4f042] text-black flex justify-between items-center">
                <span className="text-xs font-medium">Balance Due:</span>
                <span className="font-bold">{selectedInvoice.total}</span>
              </div>

              {/* Bill To */}
              <div className="p-4 border-b border-border">
                <p className="text-xs text-muted-foreground mb-1">Bill To:</p>
                <p className="text-xs font-medium text-foreground">Your Company Inc.</p>
                <p className="text-xs text-muted-foreground">123 Business Ave</p>
                <p className="text-xs text-muted-foreground">San Francisco, CA 94102</p>
              </div>

              {/* Line Items */}
              <div className="p-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="text-left py-1.5 px-2 font-medium">Item</th>
                      <th className="text-right py-1.5 px-2 font-medium">Qty</th>
                      <th className="text-right py-1.5 px-2 font-medium">Rate</th>
                      <th className="text-right py-1.5 px-2 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.lineItems.map((item, idx) => (
                      <tr key={idx} className="border-b border-border/50">
                        <td className="py-1.5 px-2 text-foreground">{item.item}</td>
                        <td className="text-right py-1.5 px-2 text-muted-foreground">{item.quantity}</td>
                        <td className="text-right py-1.5 px-2 text-muted-foreground">{item.rate}</td>
                        <td className="text-right py-1.5 px-2 text-foreground">{item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="mt-4 pt-2 border-t border-border space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="text-foreground">{selectedInvoice.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax:</span>
                    <span className="text-foreground">{selectedInvoice.tax}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-1 border-t border-border">
                    <span className="text-foreground">Total:</span>
                    <span className="text-foreground">{selectedInvoice.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
