import { z } from "zod"

export const filterCompanySchema = z.object({
  industry: z
    .array(
      z.enum([
        "SaaS",
        "Manufacturing",
        "Healthcare",
        "Retail",
        "Technology",
        "Financial Services",
        "Logistics",
        "Energy",
        "Food & Beverage",
        "Construction",
        "Education",
        "Automotive",
        "Real Estate",
        "Agriculture",
        "Chemicals",
        "Telecommunications",
        "Aerospace",
        "Textiles",
        "Gaming",
        "Cybersecurity",
        "Pharmaceuticals",
        "Marine",
        "Fitness",
        "Packaging",
        "Insurance",
        "Hospitality",
        "Media",
        "Transportation",
        "Consulting",
        "Biotechnology",
        "Renewable Energy",
        "Robotics",
        "Water Treatment",
        "Mining",
        "Veterinary",
        "Printing",
        "Waste Management",
      ]),
    )
    .optional(),
  location: z.array(z.string()).optional(),
  revenue: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  employees: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  founded: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  health: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
})

export type FilterCompanyType = z.infer<typeof filterCompanySchema>

// Valid filters that can be extracted from natural language
export const VALID_FILTERS = ["industry", "location", "revenue", "employees", "founded", "health"] as const
