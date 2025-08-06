"use client"

import { useState, useEffect } from "react"
import { ChevronDown, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MultiSelect } from "@/components/ui/multi-select"
import { usePathname } from "next/navigation"
import { csvDataService } from "@/lib/csv-data-service"

// KPI options - only metrics, not event types
const kpiOptions = [
  { label: "CPA (Cost Per Acquisition)", value: "CPA" },
  { label: "ROAS (Return on Ad Spend)", value: "ROAS" },
  { label: "CPR (Cost Per Registration)", value: "CPR" },
  { label: "CPC (Cost Per Click)", value: "CPC" },
  { label: "CPM (Cost Per Mille)", value: "CPM" },
]

interface CurvesHeaderProps {
  onFiltersChange: (selectedMedia: string, selectedCampaign: string) => void
  onAdvancedFiltersChange: (selectedGeos: string[], selectedEventNames: string[], selectedKPI: string) => void
  selectedGeos: string[]
  selectedEventNames: string[]
  selectedKPI: string
}

export function CurvesHeader({
  onFiltersChange,
  onAdvancedFiltersChange,
  selectedGeos,
  selectedEventNames,
  selectedKPI,
}: CurvesHeaderProps) {
  const [selectedMedia, setSelectedMedia] = useState("All Media")
  const [selectedCampaign, setSelectedCampaign] = useState("All Campaigns")
  const [availableOptions, setAvailableOptions] = useState({
    countries: [] as string[],
    mediaSources: [] as string[],
    campaigns: [] as string[],
    eventNames: [] as string[],
  })
  const [availableCampaigns, setAvailableCampaigns] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  // Load available options on mount
  useEffect(() => {
    loadAvailableOptions()
  }, [])

  // Load campaigns when media changes
  useEffect(() => {
    loadCampaignsForMedia()
  }, [selectedMedia])

  const loadAvailableOptions = async () => {
    try {
      const options = await csvDataService.getUniqueValues()
      setAvailableOptions(options)
    } catch (error) {
      console.error("Error loading available options:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCampaignsForMedia = async () => {
    try {
      const campaigns = await csvDataService.getCampaignsByMedia(selectedMedia)
      setAvailableCampaigns(campaigns)

      // Reset campaign selection if current campaign is not available for selected media
      if (selectedCampaign !== "All Campaigns" && !campaigns.includes(selectedCampaign)) {
        setSelectedCampaign("All Campaigns")
      }
    } catch (error) {
      console.error("Error loading campaigns for media:", error)
      setAvailableCampaigns([])
    }
  }

  // Get page title based on current route
  const getPageTitle = () => {
    if (pathname === "/") {
      return "Budget Pacing"
    }
    return "Curvas de Saturación"
  }

  // Notify parent component when filters change
  useEffect(() => {
    onFiltersChange(selectedMedia, selectedCampaign)
  }, [selectedMedia, selectedCampaign, onFiltersChange])

  // Notify parent component when advanced filters change
  useEffect(() => {
    onAdvancedFiltersChange(selectedGeos, selectedEventNames, selectedKPI)
  }, [selectedGeos, selectedEventNames, selectedKPI, onAdvancedFiltersChange])

  const handleMediaChange = (media: string) => {
    setSelectedMedia(media)
    setSelectedCampaign("All Campaigns")
  }

  const handleGeosChange = (geos: string[]) => {
    onAdvancedFiltersChange(geos, selectedEventNames, selectedKPI)
  }

  const handleEventNamesChange = (eventNames: string[]) => {
    onAdvancedFiltersChange(selectedGeos, eventNames, selectedKPI)
  }

  const handleKPIChange = (kpi: string) => {
    onAdvancedFiltersChange(selectedGeos, selectedEventNames, kpi)
  }

  const hasActiveFilters = () => {
    return (
      selectedMedia !== "All Media" ||
      selectedCampaign !== "All Campaigns" ||
      selectedGeos.length > 0 ||
      selectedEventNames.length > 0 ||
      selectedKPI !== ""
    )
  }

  // Convert data to dropdown format
  const mediaOptions = [
    { id: "all", name: "All Media" },
    ...availableOptions.mediaSources.map((media) => ({
      id: media.toLowerCase(),
      name: media.charAt(0).toUpperCase() + media.slice(1),
    })),
  ]

  const geoOptions = availableOptions.countries.map((country) => ({
    label: country,
    value: country,
  }))

  // Updated event name options based on the actual events
  const eventNameOptions = [
    { label: "Conversions", value: "conversions" },
    { label: "Revenue", value: "revenue" },
    { label: "Clicks", value: "clicks" },
    { label: "Impressions", value: "impressions" },
  ]

  if (isLoading) {
    return (
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-gray-500">Cargando filtros...</div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white border-b border-gray-200">
      {/* Main Header Row with All Filters */}
      <div className="px-8 py-6">
        <div className="flex items-center justify-between gap-6">
          {/* Left side - Title */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Judson, serif" }}>
              {getPageTitle()}
            </h1>
          </div>

          {/* Center - All Filters */}
          <div className="flex items-center gap-4 flex-1 justify-center">
            {/* Media Dropdown */}
            <div className="min-w-[140px]">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-sm bg-transparent">
                    {selectedMedia}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {mediaOptions.map((media) => (
                    <DropdownMenuItem key={media.id} onClick={() => handleMediaChange(media.name)}>
                      {media.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Campaign Dropdown */}
            <div className="min-w-[160px]">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-sm bg-transparent">
                    {selectedCampaign.length > 20 ? `${selectedCampaign.substring(0, 20)}...` : selectedCampaign}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 max-h-60 overflow-y-auto">
                  <DropdownMenuItem onClick={() => setSelectedCampaign("All Campaigns")}>
                    All Campaigns
                  </DropdownMenuItem>
                  {availableCampaigns.map((campaign) => (
                    <DropdownMenuItem key={campaign} onClick={() => setSelectedCampaign(campaign)}>
                      <div className="truncate" title={campaign}>
                        {campaign.length > 40 ? `${campaign.substring(0, 40)}...` : campaign}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Geografías */}
            <div className="min-w-[160px]">
              <MultiSelect
                options={geoOptions}
                value={selectedGeos}
                onChange={handleGeosChange}
                placeholder="Geografías..."
                className="text-sm"
              />
            </div>

            {/* Eventos */}
            <div className="min-w-[140px]">
              <MultiSelect
                options={eventNameOptions}
                value={selectedEventNames}
                onChange={handleEventNamesChange}
                placeholder="Eventos..."
                className="text-sm"
              />
            </div>

            {/* KPI */}
            <div className="min-w-[120px]">
              <Select value={selectedKPI} onValueChange={handleKPIChange}>
                <SelectTrigger className="w-full text-sm">
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <SelectValue placeholder="KPI" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {kpiOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right side - Export button */}
          <div className="flex-shrink-0">
            <Button variant="outline" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
              Exportar Datos
            </Button>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters() && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Filtros activos:</span>

            {selectedMedia !== "All Media" && (
              <Badge variant="outline" className="text-xs">
                Media: {selectedMedia}
              </Badge>
            )}

            {selectedCampaign !== "All Campaigns" && (
              <Badge variant="outline" className="text-xs">
                Campaña: {selectedCampaign.length > 30 ? `${selectedCampaign.substring(0, 30)}...` : selectedCampaign}
              </Badge>
            )}

            {selectedGeos.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {selectedGeos.length} geo{selectedGeos.length > 1 ? "s" : ""}: {selectedGeos.join(", ")}
              </Badge>
            )}

            {selectedEventNames.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {selectedEventNames.length} evento{selectedEventNames.length > 1 ? "s" : ""}:{" "}
                {selectedEventNames.join(", ")}
              </Badge>
            )}

            {selectedKPI && selectedKPI !== "" && (
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                KPI: {selectedKPI}
              </Badge>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
