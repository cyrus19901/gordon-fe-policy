"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building, TrendingUp, Users, DollarSign, Calendar, MapPin } from "lucide-react"

interface DynamicDealMockupProps {
  dealName: string
  isExiting?: boolean
}

export function DynamicDealMockup({ dealName, isExiting = false }: DynamicDealMockupProps) {
  // Generate mock data based on deal name
  const mockData = {
    industry: dealName.toLowerCase().includes("tech")
      ? "Technology"
      : dealName.toLowerCase().includes("health")
        ? "Healthcare"
        : dealName.toLowerCase().includes("energy")
          ? "Energy"
          : "Manufacturing",
    revenue: "$" + (Math.floor(Math.random() * 50) + 20) + "M",
    employees: Math.floor(Math.random() * 300) + 100 + "-" + (Math.floor(Math.random() * 200) + 400),
    location: ["New York, NY", "San Francisco, CA", "Austin, TX", "Boston, MA"][Math.floor(Math.random() * 4)],
    stage: "Series B",
    valuation: "$" + (Math.floor(Math.random() * 100) + 50) + "M",
    founded: 2015 + Math.floor(Math.random() * 8),
  }

  const containerVariants = {
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  }

  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={dealName}
        variants={containerVariants}
        initial="initial"
        animate={isExiting ? "exit" : "animate"}
        exit="exit"
        className="w-full max-w-md mx-auto"
      >
        <Card className="overflow-hidden shadow-lg border-2 border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
            <motion.div variants={itemVariants} className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-foreground mb-1 line-clamp-2">{dealName || "New Deal"}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>{mockData.industry}</span>
                </div>
              </div>
              <Badge variant="secondary" className="ml-2 flex-shrink-0">
                {mockData.stage}
              </Badge>
            </motion.div>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  <span>Revenue (LTM)</span>
                </div>
                <p className="font-semibold text-sm">{mockData.revenue}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>Valuation</span>
                </div>
                <p className="font-semibold text-sm">{mockData.valuation}</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>Employees</span>
                </div>
                <p className="font-semibold text-sm">{mockData.employees}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Founded</span>
                </div>
                <p className="font-semibold text-sm">{mockData.founded}</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>Location</span>
              </div>
              <p className="font-semibold text-sm">{mockData.location}</p>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Deal Health</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-green-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "75%" }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                  <span className="font-medium text-green-600">75%</span>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
