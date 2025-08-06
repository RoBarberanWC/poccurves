"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { CurvesHeader } from "@/components/curves-header"
import { PacingViews } from "@/components/pacing-views"

export default function HomePage() {
  const [selectedMedia, setSelectedMedia] = useState("All Media")
  const [selectedCampaign, setSelectedCampaign] = useState("All Campaigns")
  const [selectedGeos, setSelectedGeos] = useState<string[]>([])
  const [selectedEventNames, setSelectedEventNames] = useState<string[]>([])
  const [selectedKPI, setSelectedKPI] = useState<string>("")

  const handleFiltersChange = (media: string, campaign: string) => {
    setSelectedMedia(media)
    setSelectedCampaign(campaign)
  }

  const handleAdvancedFiltersChange = (geos: string[], eventNames: string[], kpi: string) => {
    setSelectedGeos(geos)
    setSelectedEventNames(eventNames)
    setSelectedKPI(kpi)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <CurvesHeader
          onFiltersChange={handleFiltersChange}
          onAdvancedFiltersChange={handleAdvancedFiltersChange}
          selectedGeos={selectedGeos}
          selectedEventNames={selectedEventNames}
          selectedKPI={selectedKPI}
        />
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <PacingViews
              selectedGeos={selectedGeos}
              selectedEventNames={selectedEventNames}
              selectedKPI={selectedKPI}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
