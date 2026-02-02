// Hierarchical sector and sub-sector data structure
export interface SubSector {
  id: string
  name: string
  deals: number
  growth: string
}

export interface SectorData {
  id: string
  name: string
  subSectors: SubSector[]
}

export const SECTOR_HIERARCHY: SectorData[] = [
  {
    id: "technology",
    name: "Technology",
    subSectors: [
      { id: "saas", name: "SaaS", deals: 45, growth: "+85%" },
      { id: "cybersecurity", name: "Cybersecurity", deals: 32, growth: "+92%" },
      { id: "cloud-infrastructure", name: "Cloud Infrastructure", deals: 28, growth: "+78%" },
      { id: "ai-ml", name: "AI & Machine Learning", deals: 24, growth: "+110%" },
      { id: "fintech", name: "FinTech", deals: 14, growth: "+65%" },
    ],
  },
  {
    id: "healthcare",
    name: "Healthcare",
    subSectors: [
      { id: "biotechnology", name: "Biotechnology", deals: 38, growth: "+72%" },
      { id: "pharmaceuticals", name: "Pharmaceuticals", deals: 29, growth: "+58%" },
      { id: "medical-devices", name: "Medical Devices", deals: 22, growth: "+45%" },
      { id: "healthcare-services", name: "Healthcare Services", deals: 15, growth: "+52%" },
      { id: "telemedicine", name: "Telemedicine", deals: 7, growth: "+95%" },
    ],
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    subSectors: [
      { id: "automotive", name: "Automotive", deals: 35, growth: "+42%" },
      { id: "aerospace", name: "Aerospace", deals: 28, growth: "+38%" },
      { id: "chemicals", name: "Chemicals", deals: 21, growth: "+35%" },
      { id: "robotics", name: "Robotics & Automation", deals: 12, growth: "+68%" },
      { id: "packaging", name: "Packaging", deals: 5, growth: "+28%" },
    ],
  },
  {
    id: "financial-services",
    name: "Financial Services",
    subSectors: [
      { id: "banking", name: "Banking", deals: 42, growth: "+55%" },
      { id: "insurance", name: "Insurance", deals: 31, growth: "+48%" },
      { id: "asset-management", name: "Asset Management", deals: 19, growth: "+62%" },
      { id: "payments", name: "Payments", deals: 13, growth: "+78%" },
    ],
  },
  {
    id: "energy",
    name: "Energy",
    subSectors: [
      { id: "renewable-energy", name: "Renewable Energy", deals: 48, growth: "+88%" },
      { id: "oil-gas", name: "Oil & Gas", deals: 35, growth: "+45%" },
      { id: "utilities", name: "Utilities", deals: 18, growth: "+32%" },
      { id: "energy-storage", name: "Energy Storage", deals: 6, growth: "+105%" },
    ],
  },
  {
    id: "real-estate",
    name: "Real Estate",
    subSectors: [
      { id: "commercial", name: "Commercial Real Estate", deals: 29, growth: "+38%" },
      { id: "residential", name: "Residential", deals: 24, growth: "+42%" },
      { id: "industrial", name: "Industrial", deals: 18, growth: "+35%" },
      { id: "proptech", name: "PropTech", deals: 8, growth: "+72%" },
    ],
  },
]

export const getSectorById = (id: string): SectorData | undefined => {
  return SECTOR_HIERARCHY.find((sector) => sector.id === id.toLowerCase().replace(/\s+/g, "-"))
}

export const getSectorByName = (name: string): SectorData | undefined => {
  return SECTOR_HIERARCHY.find((sector) => sector.name.toLowerCase() === name.toLowerCase())
}
