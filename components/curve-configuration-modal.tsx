"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Campaign {
  name: string
  color: string
  seasonal: boolean
  mediaSource: string
  geo: string
}

interface Media {
  name: string
  color: string
  campaigns: number
}

const campaigns: Campaign[] = [
  { name: "Facebook US", color: "#1877F2", seasonal: false, mediaSource: "Facebook", geo: "US" },
  { name: "Google CA", color: "#EA4335", seasonal: false, mediaSource: "Google", geo: "CA" },
  { name: "TikTok UK", color: "#000000", seasonal: false, mediaSource: "TikTok", geo: "UK" },
  { name: "Instagram Holiday", color: "#E4405F", seasonal: true, mediaSource: "Instagram", geo: "US" },
  { name: "Facebook CA", color: "#1877F2", seasonal: false, mediaSource: "Facebook", geo: "CA" },
  { name: "Google UK", color: "#EA4335", seasonal: false, mediaSource: "Google", geo: "UK" },
  { name: "Facebook MX", color: "#1877F2", seasonal: false, mediaSource: "Facebook", geo: "MX" },
  { name: "Google BR", color: "#EA4335", seasonal: false, mediaSource: "Google", geo: "BR" },
]

const medias: Media[] = [
  { name: "Facebook", color: "#1877F2", campaigns: 3 },
  { name: "Google", color: "#EA4335", campaigns: 3 },
  { name: "TikTok", color: "#000000", campaigns: 1 },
  { name: "Instagram", color: "#E4405F", campaigns: 1 },
]

interface CurveConfigurationModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateCurve: (excludedCampaigns: string[], excludedMedias: string[]) => void
  selectedMedia?: string
  selectedCampaign?: string
  selectedGeos?: string[]
  selectedEventNames?: string[]
  selectedKPI?: string
  viewMode?: "campaign" | "media"
}

export function CurveConfigurationModal({
  isOpen,
  onClose,
  onCreateCurve,
  selectedMedia = "All Media",
  selectedCampaign = "All Campaigns",
  selectedGeos = [],
  selectedEventNames = [],
  selectedKPI = "CPA",
  viewMode = "campaign",
}: CurveConfigurationModalProps) {
  const [excludedCampaigns, setExcludedCampaigns] = useState<string[]>([])
  const [excludedMedias, setExcludedMedias] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("campaigns")

  // Get relevant campaigns based on current filters
  const getRelevantCampaigns = () => {
    let relevantCampaigns = campaigns

    if (viewMode === "campaign" && selectedCampaign !== "All Campaigns") {
      // If viewing a specific campaign, only show that campaign
      relevantCampaigns = campaigns.filter((campaign) => campaign.name === selectedCampaign)
    } else if (selectedMedia !== "All Media") {
      // If a specific media is selected, only show campaigns from that media
      relevantCampaigns = campaigns.filter((campaign) => campaign.mediaSource === selectedMedia)
    }

    // Apply geo filter if any geos are selected
    if (selectedGeos.length > 0) {
      relevantCampaigns = relevantCampaigns.filter((campaign) => selectedGeos.includes(campaign.geo))
    }

    return relevantCampaigns
  }

  // Get relevant medias based on current filters
  const getRelevantMedias = () => {
    if (viewMode === "media" && selectedMedia !== "All Media") {
      // If viewing a specific media, only show that media
      return medias.filter((media) => media.name === selectedMedia)
    }
    // Otherwise show all medias
    return medias
  }

  const relevantCampaigns = getRelevantCampaigns()
  const relevantMedias = getRelevantMedias()

  // Initialize exclusions based on current context
  useEffect(() => {
    if (isOpen) {
      // Reset exclusions when modal opens
      setExcludedCampaigns([])
      setExcludedMedias([])

      // Set appropriate tab based on view mode and context
      if (viewMode === "campaign" && selectedCampaign !== "All Campaigns") {
        setActiveTab("campaigns")
      } else if (viewMode === "media" && selectedMedia !== "All Media") {
        setActiveTab("media")
      } else {
        setActiveTab("campaigns")
      }
    }
  }, [isOpen, viewMode, selectedMedia, selectedCampaign])

  const toggleCampaign = (campaignName: string) => {
    setExcludedCampaigns((prev) =>
      prev.includes(campaignName) ? prev.filter((name) => name !== campaignName) : [...prev, campaignName],
    )
  }

  const toggleMedia = (mediaName: string) => {
    setExcludedMedias((prev) =>
      prev.includes(mediaName) ? prev.filter((name) => name !== mediaName) : [...prev, mediaName],
    )
  }

  const handleCreateCurve = () => {
    onCreateCurve(excludedCampaigns, excludedMedias)
    onClose()
  }

  const handleCancel = () => {
    setExcludedCampaigns([])
    setExcludedMedias([])
    onClose()
  }

  // Get modal title based on context
  const getModalTitle = () => {
    if (viewMode === "campaign" && selectedCampaign !== "All Campaigns") {
      return `Generar Curva ${selectedKPI}: ${selectedCampaign}`
    } else if (viewMode === "media" && selectedMedia !== "All Media") {
      return `Generar Curva ${selectedKPI}: ${selectedMedia}`
    }
    return `Generar Curvas de Saturación - ${selectedKPI}`
  }

  // Get modal description based on context
  const getModalDescription = () => {
    let description = ""
    if (viewMode === "campaign" && selectedCampaign !== "All Campaigns") {
      description = `Configurando la curva de saturación de ${selectedKPI} para la campaña "${selectedCampaign}".`
    } else if (viewMode === "media" && selectedMedia !== "All Media") {
      description = `Configurando la curva de saturación de ${selectedKPI} para "${selectedMedia}". Selecciona qué campañas de esta media incluir en el análisis agregado.`
    } else {
      description = `Selecciona las campañas o medios que deseas incluir en el análisis de curvas de saturación para ${selectedKPI}.`
    }

    // Add filter information
    const activeFilters = []
    if (selectedGeos.length > 0) {
      activeFilters.push(`${selectedGeos.length} geografía${selectedGeos.length > 1 ? "s" : ""}`)
    }
    if (selectedEventNames.length > 0) {
      activeFilters.push(`${selectedEventNames.length} evento${selectedEventNames.length > 1 ? "s" : ""}`)
    }

    if (activeFilters.length > 0) {
      description += ` Filtros aplicados: ${activeFilters.join(", ")}.`
    }

    return description
  }

  // Check if we should show tabs or just one section
  const shouldShowTabs = () => {
    // If we're viewing a specific campaign, only show campaign options
    if (viewMode === "campaign" && selectedCampaign !== "All Campaigns") {
      return false
    }
    // If we're viewing a specific media, we might want to show campaign exclusions within that media
    if (viewMode === "media" && selectedMedia !== "All Media") {
      return relevantCampaigns.length > 1 // Only show tabs if there are multiple campaigns to configure
    }
    return true
  }

  const showTabs = shouldShowTabs()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold" style={{ fontFamily: "Judson, serif" }}>
            {getModalTitle()}
          </DialogTitle>
          <p className="text-sm text-gray-600">{getModalDescription()}</p>

          {/* KPI Information */}
          <div className="mt-2 p-2 bg-purple-50 rounded-lg">
            <div className="text-xs text-purple-700">
              <strong>KPI Seleccionado:</strong> {selectedKPI} -{selectedKPI === "CPA" && " Costo por adquisición"}
              {selectedKPI === "ROAS" && " Retorno sobre inversión publicitaria"}
              {selectedKPI === "CPR" && " Costo por registro"}
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {showTabs ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="campaigns">Configurar Campañas</TabsTrigger>
                <TabsTrigger value="media">Configurar Medios</TabsTrigger>
              </TabsList>

              <TabsContent value="campaigns" className="mt-4">
                <div className="space-y-4">
                  <div className="text-sm font-medium text-gray-700">
                    Campañas Disponibles ({relevantCampaigns.length - excludedCampaigns.length} de{" "}
                    {relevantCampaigns.length} incluidas)
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                    {relevantCampaigns.map((campaign) => (
                      <div
                        key={campaign.name}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={campaign.name}
                            checked={!excludedCampaigns.includes(campaign.name)}
                            onCheckedChange={() => toggleCampaign(campaign.name)}
                          />
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: campaign.color }} />
                            <span className="font-medium">{campaign.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {campaign.geo}
                          </Badge>
                          {campaign.seasonal && (
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                              Seasonal
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="media" className="mt-4">
                <div className="space-y-4">
                  <div className="text-sm font-medium text-gray-700">
                    Medios Disponibles ({relevantMedias.length - excludedMedias.length} de {relevantMedias.length}{" "}
                    incluidos)
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                    {relevantMedias.map((media) => (
                      <div
                        key={media.name}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={media.name}
                            checked={!excludedMedias.includes(media.name)}
                            onCheckedChange={() => toggleMedia(media.name)}
                          />
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: media.color }} />
                            <span className="font-medium">{media.name}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {media.campaigns} campañas
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            // Single section view when viewing specific campaign
            <div className="space-y-4">
              {viewMode === "campaign" && selectedCampaign !== "All Campaigns" ? (
                <>
                  <div className="text-sm font-medium text-gray-700">Configuración de Campaña</div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full bg-green-500" />
                      <div>
                        <div className="font-medium text-blue-900">{selectedCampaign}</div>
                        <div className="text-sm text-blue-700">
                          Esta campaña está seleccionada y será incluida en el análisis de curvas de saturación para{" "}
                          {selectedKPI}.
                        </div>
                      </div>
                    </div>
                  </div>
                  {(selectedGeos.length > 0 || selectedEventNames.length > 0) && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-700">
                        <strong>Filtros aplicados:</strong>
                        {selectedGeos.length > 0 && <span className="ml-2">Geos: {selectedGeos.join(", ")}</span>}
                        {selectedEventNames.length > 0 && (
                          <span className="ml-2">Eventos: {selectedEventNames.join(", ")}</span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Para configurar múltiples campañas, selecciona "All Campaigns" en los filtros superiores.
                  </div>
                </>
              ) : (
                // Show campaigns for the selected media
                <>
                  <div className="text-sm font-medium text-gray-700">
                    Campañas de {selectedMedia} ({relevantCampaigns.length - excludedCampaigns.length} de{" "}
                    {relevantCampaigns.length} incluidas)
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                    {relevantCampaigns.map((campaign) => (
                      <div
                        key={campaign.name}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={campaign.name}
                            checked={!excludedCampaigns.includes(campaign.name)}
                            onCheckedChange={() => toggleCampaign(campaign.name)}
                          />
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: campaign.color }} />
                            <span className="font-medium">{campaign.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {campaign.geo}
                          </Badge>
                          {campaign.seasonal && (
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                              Seasonal
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {(selectedGeos.length > 0 || selectedEventNames.length > 0) && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-700">
                        <strong>Filtros aplicados:</strong>
                        {selectedGeos.length > 0 && <span className="ml-2">Geos: {selectedGeos.join(", ")}</span>}
                        {selectedEventNames.length > 0 && (
                          <span className="ml-2">Eventos: {selectedEventNames.join(", ")}</span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleCreateCurve} className="bg-green-600 hover:bg-green-700 text-white">
            Generar Curvas {selectedKPI}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
