"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, TrendingUp, Calendar, BarChart3 } from "lucide-react"
import { SaturationCurvesConfigModal } from "./saturation-curves-config-modal"
import { SaturationCurvesModal } from "./saturation-curves-modal"

// Mock data for pacing views
const pacingViews = [
  { id: "br-test-may3", name: "BR - TEST - MAY 3", active: true },
  { id: "welhub-april-br", name: "Welhub - April - BR", active: false },
  { id: "welhub-april-uk", name: "Welhub - April - UK", active: false },
  { id: "welhub-may-uk", name: "Welhub - May - UK", active: false },
  { id: "welhub-may-de", name: "Welhub - May - DE", active: false },
  { id: "welhub-may-es", name: "Welhub - May - ES", active: false },
  { id: "welhub-may-it", name: "Welhub - May - IT", active: false },
  { id: "welhub-may-ie", name: "Welhub - May - IE", active: false },
  { id: "welhub-may-ar", name: "Welhub - May - AR", active: false },
  { id: "welhub-may-mx", name: "Welhub - May - MX", active: false },
  { id: "welhub-may-cl", name: "Welhub - May - CL", active: false },
]

// Mock pacing data
const countryPacingData = [
  {
    country: "Brazil",
    plannedBudget: 50000,
    spend: 32000,
    projectedSpend: 45000,
    projectedPercentage: 90,
    projectedSpendMedia: 42000,
    isRecurring: true,
    isSpecialDate: false,
  },
  {
    country: "United States",
    plannedBudget: 80000,
    spend: 55000,
    projectedSpend: 75000,
    projectedPercentage: 94,
    projectedSpendMedia: 70000,
    isRecurring: true,
    isSpecialDate: false,
  },
  {
    country: "United Kingdom",
    plannedBudget: 35000,
    spend: 28000,
    projectedSpend: 33000,
    projectedPercentage: 94,
    projectedSpendMedia: 31000,
    isRecurring: false,
    isSpecialDate: true,
  },
]

const mediaPacingData = [
  {
    media: "Facebook",
    plannedBudget: 75000,
    spend: 48000,
    projectedSpend: 70000,
    projectedPercentage: 93,
    projectedSpendMedia: 65000,
    isRecurring: true,
    isSpecialDate: false,
  },
  {
    media: "Google",
    plannedBudget: 60000,
    spend: 42000,
    projectedSpend: 56000,
    projectedPercentage: 93,
    projectedSpendMedia: 52000,
    isRecurring: true,
    isSpecialDate: false,
  },
  {
    media: "TikTok",
    plannedBudget: 30000,
    spend: 25000,
    projectedSpend: 28000,
    projectedPercentage: 93,
    projectedSpendMedia: 26000,
    isRecurring: false,
    isSpecialDate: true,
  },
]

interface PacingViewsProps {
  selectedGeos?: string[]
  selectedEventNames?: string[]
  selectedKPI?: string
}

export function PacingViews({ selectedGeos = [], selectedEventNames = [], selectedKPI = "" }: PacingViewsProps) {
  const [activeView, setActiveView] = useState("br-test-may3")
  const [saturationConfig, setSaturationConfig] = useState({
    budgetSource: "real" as "real" | "hypothetical",
    modelingScenario: "recurring" as "recurring" | "recurring-new" | "recurring-special" | "all",
    newCampaignPercentage: 15,
    showCurves: false,
    selectedMedia: "All Media",
    selectedCampaign: "All Campaigns",
    selectedGeos: [] as string[],
    selectedEventNames: [] as string[],
    selectedKPI: "",
  })
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [isSaturationModalOpen, setIsSaturationModalOpen] = useState(false)

  // Check available scenarios based on data
  const hasNewCampaigns =
    countryPacingData.some((item) => !item.isRecurring) || mediaPacingData.some((item) => !item.isRecurring)
  const hasSpecialDates =
    countryPacingData.some((item) => item.isSpecialDate) || mediaPacingData.some((item) => item.isSpecialDate)

  // Filter data based on modeling scenario
  const getFilteredCountryData = () => {
    let data = [...countryPacingData]

    switch (saturationConfig.modelingScenario) {
      case "recurring":
        data = data.filter((item) => item.isRecurring && !item.isSpecialDate)
        break
      case "recurring-new":
        // Include recurring + add percentage for new campaigns
        data = data.filter((item) => item.isRecurring && !item.isSpecialDate)
        // Add hypothetical budget for new campaigns
        if (hasNewCampaigns) {
          const totalRecurringBudget = data.reduce((sum, item) => sum + item.plannedBudget, 0)
          const newCampaignBudget = (totalRecurringBudget * saturationConfig.newCampaignPercentage) / 100
          data.push({
            country: "New Campaigns",
            plannedBudget: newCampaignBudget,
            spend: 0,
            projectedSpend: newCampaignBudget * 0.8,
            projectedPercentage: 80,
            projectedSpendMedia: newCampaignBudget * 0.75,
            isRecurring: false,
            isSpecialDate: false,
          })
        }
        break
      case "recurring-special":
        data = data.filter((item) => item.isRecurring || item.isSpecialDate)
        break
      case "all":
        // Include all + add percentage for new campaigns if needed
        if (hasNewCampaigns && !data.some((item) => !item.isRecurring && !item.isSpecialDate)) {
          const totalBudget = data.reduce((sum, item) => sum + item.plannedBudget, 0)
          const newCampaignBudget = (totalBudget * saturationConfig.newCampaignPercentage) / 100
          data.push({
            country: "New Campaigns",
            plannedBudget: newCampaignBudget,
            spend: 0,
            projectedSpend: newCampaignBudget * 0.8,
            projectedPercentage: 80,
            projectedSpendMedia: newCampaignBudget * 0.75,
            isRecurring: false,
            isSpecialDate: false,
          })
        }
        break
    }

    return data
  }

  const getFilteredMediaData = () => {
    let data = [...mediaPacingData]

    switch (saturationConfig.modelingScenario) {
      case "recurring":
        data = data.filter((item) => item.isRecurring && !item.isSpecialDate)
        break
      case "recurring-new":
        data = data.filter((item) => item.isRecurring && !item.isSpecialDate)
        if (hasNewCampaigns) {
          const totalRecurringBudget = data.reduce((sum, item) => sum + item.plannedBudget, 0)
          const newCampaignBudget = (totalRecurringBudget * saturationConfig.newCampaignPercentage) / 100
          data.push({
            media: "New Campaigns",
            plannedBudget: newCampaignBudget,
            spend: 0,
            projectedSpend: newCampaignBudget * 0.8,
            projectedPercentage: 80,
            projectedSpendMedia: newCampaignBudget * 0.75,
            isRecurring: false,
            isSpecialDate: false,
          })
        }
        break
      case "recurring-special":
        data = data.filter((item) => item.isRecurring || item.isSpecialDate)
        break
      case "all":
        if (hasNewCampaigns && !data.some((item) => !item.isRecurring && !item.isSpecialDate)) {
          const totalBudget = data.reduce((sum, item) => sum + item.plannedBudget, 0)
          const newCampaignBudget = (totalBudget * saturationConfig.newCampaignPercentage) / 100
          data.push({
            media: "New Campaigns",
            plannedBudget: newCampaignBudget,
            spend: 0,
            projectedSpend: newCampaignBudget * 0.8,
            projectedPercentage: 80,
            projectedSpendMedia: newCampaignBudget * 0.75,
            isRecurring: false,
            isSpecialDate: false,
          })
        }
        break
    }

    return data
  }

  const filteredCountryData = getFilteredCountryData()
  const filteredMediaData = getFilteredMediaData()

  const getScenarioOptions = () => {
    const options = [
      { value: "recurring", label: "Solo campañas recurrentes", available: true },
      {
        value: "recurring-new",
        label: `Recurrentes + ${saturationConfig.newCampaignPercentage}% nuevas`,
        available: hasNewCampaigns,
      },
      {
        value: "recurring-special",
        label: "Recurrentes + Special Dates",
        available: hasSpecialDates,
      },
      {
        value: "all",
        label: `Todas + ${saturationConfig.newCampaignPercentage}% nuevas`,
        available: hasNewCampaigns && hasSpecialDates,
      },
    ]

    return options.filter((option) => option.available)
  }

  const activeViewData = pacingViews.find((view) => view.id === activeView)

  const handleSaturationCurvesClick = () => {
    if (saturationConfig.showCurves && saturationConfig.selectedKPI) {
      // If curves are already configured, open the full modal directly
      setIsSaturationModalOpen(true)
    } else {
      // Otherwise, open configuration modal
      setIsConfigModalOpen(true)
    }
  }

  const handleConfigApply = (config: {
    budgetSource: "real" | "hypothetical"
    modelingScenario: "recurring" | "recurring-new" | "recurring-special" | "all"
    newCampaignPercentage: number
    showCurves: boolean
    selectedMedia: string
    selectedCampaign: string
    selectedGeos: string[]
    selectedEventNames: string[]
    selectedKPI: string
  }) => {
    setSaturationConfig(config)
    // Automatically open the saturation curves modal after configuration
    setIsSaturationModalOpen(true)
  }

  const getButtonText = () => {
    if (saturationConfig.showCurves && saturationConfig.selectedKPI) {
      return "Ver Curvas de Saturación"
    }
    return "Configurar Saturation Curves"
  }

  const getButtonIcon = () => {
    if (saturationConfig.showCurves && saturationConfig.selectedKPI) {
      return <BarChart3 className="w-4 h-4 mr-2" />
    }
    return <TrendingUp className="w-4 h-4 mr-2" />
  }

  return (
    <div className="space-y-6">
      {/* Header with tabs and buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Tabs defaultValue="views" className="w-auto">
            <TabsList>
              <TabsTrigger value="views">Pacing views</TabsTrigger>
              <TabsTrigger value="setup">Pacing setup</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant={saturationConfig.showCurves ? "default" : "outline"}
            onClick={handleSaturationCurvesClick}
            className={saturationConfig.showCurves ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            {getButtonIcon()}
            {getButtonText()}
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add pacing view
          </Button>
        </div>
      </div>

      {/* Pacing Views Tabs */}
      <div className="flex flex-wrap gap-2">
        {pacingViews.map((view) => (
          <Button
            key={view.id}
            variant={activeView === view.id ? "default" : "outline"}
            onClick={() => setActiveView(view.id)}
            className={`text-sm ${
              activeView === view.id
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {view.name}
          </Button>
        ))}
      </div>

      {/* Configuration Status */}
      {saturationConfig.showCurves && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-800">Curvas de Saturación Configuradas</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {saturationConfig.budgetSource === "real" ? "Spend Real" : "Budget Hipotético"}
                  </Badge>
                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                    {getScenarioOptions().find((opt) => opt.value === saturationConfig.modelingScenario)?.label}
                  </Badge>
                  {saturationConfig.selectedKPI && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      KPI: {saturationConfig.selectedKPI}
                    </Badge>
                  )}
                  {(saturationConfig.selectedMedia !== "All Media" ||
                    saturationConfig.selectedCampaign !== "All Campaigns" ||
                    saturationConfig.selectedGeos.length > 0 ||
                    saturationConfig.selectedEventNames.length > 0) && (
                    <Badge variant="outline" className="text-xs">
                      Filtros aplicados
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfigModalOpen(true)}
                className="text-purple-700 border-purple-300 hover:bg-purple-50"
              >
                Reconfigurar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saturation Curves Configuration Modal */}
      <SaturationCurvesConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onApply={handleConfigApply}
        currentConfig={saturationConfig}
        hasNewCampaigns={hasNewCampaigns}
        hasSpecialDates={hasSpecialDates}
      />

      {/* Saturation Curves Full Modal */}
      <SaturationCurvesModal
        isOpen={isSaturationModalOpen}
        onClose={() => setIsSaturationModalOpen(false)}
        selectedGeos={selectedGeos}
        selectedEventNames={selectedEventNames}
        selectedKPI={selectedKPI}
        saturationConfig={saturationConfig}
      />

      {/* Active View Info */}
      {activeViewData && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold">Pacing monthly (Spend)</h2>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-1" />
              2025-07-01 to 2025-07-31
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Only Tables (no curves inline) */}
      <div className="space-y-6">
        {/* Country Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Country
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({filteredCountryData.length} países | Escenario:{" "}
                {getScenarioOptions().find((opt) => opt.value === saturationConfig.modelingScenario)?.label})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead>Planned budget</TableHead>
                    <TableHead>Spend</TableHead>
                    <TableHead>Projected Spend (AVG 7)</TableHead>
                    <TableHead>% Projected (AVG 7)</TableHead>
                    <TableHead>Projected Spend (Media)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCountryData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 mb-4 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-12 h-12 text-gray-300">
                              <path fill="currentColor" d="M12 2L2 12L12 22L22 12L12 2Z" />
                            </svg>
                          </div>
                          <p>No hay datos disponibles para el escenario seleccionado</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCountryData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <span>{row.country}</span>
                            {!row.isRecurring && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                New
                              </Badge>
                            )}
                            {row.isSpecialDate && (
                              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                Special
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          ${row.plannedBudget.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium text-blue-600">${row.spend.toLocaleString()}</TableCell>
                        <TableCell className="font-medium text-purple-600">
                          ${row.projectedSpend.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          <span className={row.projectedPercentage >= 90 ? "text-green-600" : "text-orange-600"}>
                            {row.projectedPercentage}%
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-gray-600">
                          ${row.projectedSpendMedia.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Media Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Media
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({filteredMediaData.length} medios | Escenario:{" "}
                {getScenarioOptions().find((opt) => opt.value === saturationConfig.modelingScenario)?.label})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Media</TableHead>
                    <TableHead>Planned budget</TableHead>
                    <TableHead>Spend</TableHead>
                    <TableHead>Projected Spend (AVG 7)</TableHead>
                    <TableHead>% Projected (AVG 7)</TableHead>
                    <TableHead>Projected Spend (Media)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMediaData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 mb-4 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-12 h-12 text-gray-300">
                              <path fill="currentColor" d="M12 2L2 12L12 22L22 12L12 2Z" />
                            </svg>
                          </div>
                          <p>No hay datos disponibles para el escenario seleccionado</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMediaData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <span>{row.media}</span>
                            {!row.isRecurring && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                New
                              </Badge>
                            )}
                            {row.isSpecialDate && (
                              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                Special
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          ${row.plannedBudget.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium text-blue-600">${row.spend.toLocaleString()}</TableCell>
                        <TableCell className="font-medium text-purple-600">
                          ${row.projectedSpend.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          <span className={row.projectedPercentage >= 90 ? "text-green-600" : "text-orange-600"}>
                            {row.projectedPercentage}%
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-gray-600">
                          ${row.projectedSpendMedia.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
