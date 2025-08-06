"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Target, AlertCircle, TrendingUp, Loader2 } from "lucide-react"
import { SaturationChart } from "./saturation-chart"
import { CurveConfigurationModal } from "./curve-configuration-modal"
import { csvDataService, type ProcessedCampaignData } from "@/lib/csv-data-service"

interface SaturationCurvesProps {
  selectedMedia?: string
  selectedCampaign?: string
  selectedGeos?: string[]
  selectedEventNames?: string[]
  selectedKPI?: string
}

export function SaturationCurves({
  selectedMedia = "All Media",
  selectedCampaign = "All Campaigns",
  selectedGeos = [],
  selectedEventNames = [],
  selectedKPI = "",
}: SaturationCurvesProps) {
  const [viewMode, setViewMode] = useState<"campaign" | "media">("campaign")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [excludedCampaigns, setExcludedCampaigns] = useState<string[]>([])
  const [excludedMedias, setExcludedMedias] = useState<string[]>([])
  const [curvesGenerated, setCurvesGenerated] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [campaignData, setCampaignData] = useState<ProcessedCampaignData[]>([])
  const [mediaData, setMediaData] = useState<ProcessedCampaignData[]>([])
  const [availableOptions, setAvailableOptions] = useState({
    countries: [] as string[],
    mediaSources: [] as string[],
    campaigns: [] as string[],
    eventNames: [] as string[],
  })

  // Load data when filters change
  useEffect(() => {
    loadData()
  }, [selectedMedia, selectedCampaign, selectedGeos, selectedEventNames])

  // Load available options on mount
  useEffect(() => {
    loadAvailableOptions()
  }, [])

  const loadAvailableOptions = async () => {
    try {
      const options = await csvDataService.getUniqueValues()
      setAvailableOptions(options)
    } catch (error) {
      console.error("Error loading available options:", error)
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const filters = {
        selectedMedia,
        selectedCampaign,
        selectedGeos,
        selectedEventNames,
      }

      const [campaignResults, mediaResults] = await Promise.all([
        csvDataService.getProcessedCampaignData(filters),
        csvDataService.getMediaAggregatedData(filters),
      ])

      setCampaignData(campaignResults)
      setMediaData(mediaResults)
    } catch (error) {
      console.error("Error loading data:", error)
      setCampaignData([])
      setMediaData([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCurve = async (excludedCampaigns: string[], excludedMedias: string[]) => {
    setExcludedCampaigns(excludedCampaigns)
    setExcludedMedias(excludedMedias)
    setIsGenerating(true)

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setCurvesGenerated(true)
    setIsGenerating(false)
  }

  const handleGenerateCurves = () => {
    const hasValidSelection =
      (viewMode === "campaign" && selectedCampaign !== "All Campaigns") ||
      (viewMode === "media" && selectedMedia !== "All Media")

    if (!hasValidSelection) {
      return
    }

    setIsModalOpen(true)
  }

  const shouldShowData = () => {
    if (viewMode === "campaign") {
      return selectedCampaign !== "All Campaigns"
    } else {
      return selectedMedia !== "All Media"
    }
  }

  const canGenerateCurves = () => {
    return shouldShowData() && selectedKPI !== ""
  }

  const resetCurvesIfNeeded = () => {
    if (curvesGenerated) {
      setCurvesGenerated(false)
    }
  }

  React.useEffect(() => {
    resetCurvesIfNeeded()
  }, [viewMode, selectedMedia, selectedCampaign, selectedGeos, selectedEventNames, selectedKPI])

  const getEventColumnName = () => {
    if (selectedEventNames.length === 0) {
      return "Events"
    } else if (selectedEventNames.length === 1) {
      return selectedEventNames[0].charAt(0).toUpperCase() + selectedEventNames[0].slice(1)
    } else {
      return "Selected Events"
    }
  }

  const getKPIValue = (row: ProcessedCampaignData) => {
    switch (selectedKPI) {
      case "CPA":
        return row.events > 0 ? (row.spend / row.events).toFixed(2) : "0.00"
      case "ROAS":
        return row.spend > 0 ? (row.revenue / row.spend).toFixed(2) : "0.00"
      case "CPR":
        if (row.event_name === "registrations" || row.event_name === "mixed") {
          return row.events > 0 ? (row.spend / row.events).toFixed(2) : "0.00"
        } else {
          return "N/A"
        }
      case "CPC":
        if (row.event_name === "clicks" || row.event_name === "mixed") {
          return row.events > 0 ? (row.spend / row.events).toFixed(2) : "0.00"
        } else {
          return "N/A"
        }
      case "CPM":
        if (row.event_name === "impressions" || row.event_name === "mixed") {
          return row.events > 0 ? ((row.spend / row.events) * 1000).toFixed(2) : "0.00"
        } else {
          return "N/A"
        }
      default:
        return "0.00"
    }
  }

  const getKPIColumnHeader = () => {
    switch (selectedKPI) {
      case "CPA":
        return "CPA"
      case "ROAS":
        return "ROAS"
      case "CPR":
        return "CPR"
      case "CPC":
        return "CPC"
      case "CPM":
        return "CPM"
      default:
        return "KPI"
    }
  }

  const getSelectionMessage = () => {
    if (viewMode === "campaign") {
      return {
        title: "Selecciona una campaña para continuar",
        description:
          'Para ver los datos detallados por campaña, utiliza el filtro de "Campaña" en la parte superior para seleccionar una campaña específica.',
        alternative: 'O cambia a "Ver por Media" para ver datos agregados por fuente de medios.',
      }
    } else {
      return {
        title: "Selecciona una media para continuar",
        description:
          'Para ver los datos detallados por media, utiliza el filtro de "Media" en la parte superior para seleccionar una fuente de medios específica.',
        alternative: 'O cambia a "Ver por Campaña" para ver datos individuales por campaña.',
      }
    }
  }

  const selectionMessage = getSelectionMessage()
  const currentData = viewMode === "campaign" ? campaignData : mediaData

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-8 space-y-6">
        <div className="max-w-full mx-auto">
          {/* View Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "campaign" ? "default" : "outline"}
                onClick={() => setViewMode("campaign")}
                className={
                  viewMode === "campaign"
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "border-purple-300 text-purple-700 hover:bg-purple-50"
                }
              >
                Ver por Campaña
              </Button>
              <Button
                variant={viewMode === "media" ? "default" : "outline"}
                onClick={() => setViewMode("media")}
                className={
                  viewMode === "media"
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "border-purple-300 text-purple-700 hover:bg-purple-50"
                }
              >
                Ver por Media
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={handleGenerateCurves}
                disabled={!canGenerateCurves() || isGenerating}
                className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Target className="w-4 h-4 mr-2" />
                {isGenerating ? "Generando..." : "Generar Curvas"}
              </Button>
            </div>
          </div>

          {/* Status Messages */}
          {canGenerateCurves() && !curvesGenerated && !isGenerating && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 text-sm text-blue-700">
                <Target className="w-4 h-4" />
                <span className="font-medium">Listo para generar curvas</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Configuración actual:{" "}
                {viewMode === "campaign" ? `Campaña - ${selectedCampaign}` : `Media - ${selectedMedia}`} | KPI:{" "}
                {selectedKPI}. Haz clic en "Generar Curvas" para configurar y visualizar las curvas de saturación.
              </p>
            </div>
          )}

          {isGenerating && (
            <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2 text-sm text-yellow-700">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-700"></div>
                <span className="font-medium">Generando curvas de saturación...</span>
              </div>
              <p className="text-sm text-yellow-600 mt-1">
                Procesando datos y calculando puntos óptimos de inversión para {selectedKPI}.
              </p>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left Column - Table */}
            <div className="xl:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    {viewMode === "campaign" ? "Datos por Campaña" : "Datos por Media"}
                    {shouldShowData() ? (
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        ({currentData.length} registros | KPI: {selectedKPI})
                      </span>
                    ) : null}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {!shouldShowData()
                      ? `Selecciona ${viewMode === "campaign" ? "una campaña" : "una media"} específica para ver los datos detallados`
                      : "Datos en tiempo real desde CSV"}
                  </p>
                </CardHeader>
                <CardContent>
                  {!shouldShowData() ? (
                    <div className="text-center py-12 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <div className="text-lg font-medium mb-2">{selectionMessage.title}</div>
                      <p className="text-sm">{selectionMessage.description}</p>
                      <p className="text-xs mt-2 text-gray-400">{selectionMessage.alternative}</p>
                    </div>
                  ) : (
                    <>
                      {selectedKPI === "" && shouldShowData() && (
                        <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-center space-x-2 text-sm text-yellow-700">
                            <TrendingUp className="w-4 h-4" />
                            <span className="font-medium">Selecciona un KPI para continuar</span>
                          </div>
                          <p className="text-sm text-yellow-600 mt-1">
                            Para ver los datos y generar curvas de saturación, selecciona un KPI (CPA, ROAS, CPR, CPC o
                            CPM) en los filtros superiores.
                          </p>
                        </div>
                      )}

                      {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                          <span className="ml-2 text-gray-600">Cargando datos...</span>
                        </div>
                      ) : (
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                          <Table>
                            <TableHeader className="sticky top-0 bg-white z-10">
                              <TableRow>
                                <TableHead>Week</TableHead>
                                <TableHead>Spend</TableHead>
                                <TableHead>{getEventColumnName()}</TableHead>
                                {selectedKPI === "ROAS" && <TableHead>Revenue</TableHead>}
                                <TableHead className="font-semibold text-purple-700">{getKPIColumnHeader()}</TableHead>
                                <TableHead>Geo</TableHead>
                                <TableHead>Event Type</TableHead>
                                {viewMode === "campaign" && <TableHead>Media Source</TableHead>}
                                {viewMode === "campaign" && <TableHead>Campaign</TableHead>}
                                {viewMode === "media" && <TableHead>Media Source</TableHead>}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {currentData.map((row, index) => {
                                const kpiValue = getKPIValue(row)
                                const isKPINA = kpiValue === "N/A"

                                return (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{row.week}</TableCell>
                                    <TableCell className="font-medium text-green-600">
                                      ${row.spend.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="font-medium text-blue-600">{row.events}</TableCell>
                                    {selectedKPI === "ROAS" && (
                                      <TableCell className="font-medium text-orange-600">
                                        ${row.revenue.toLocaleString()}
                                      </TableCell>
                                    )}
                                    <TableCell
                                      className={`font-bold ${
                                        isKPINA
                                          ? "text-gray-400"
                                          : selectedKPI === "ROAS"
                                            ? "text-orange-700"
                                            : "text-purple-600"
                                      }`}
                                    >
                                      {selectedKPI === "ROAS" && !isKPINA
                                        ? `${kpiValue}x`
                                        : isKPINA
                                          ? "N/A"
                                          : `$${kpiValue}`}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{row.geo}</Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="secondary"
                                        className={
                                          row.event_name === "conversions"
                                            ? "bg-green-100 text-green-800"
                                            : row.event_name === "clicks"
                                              ? "bg-blue-100 text-blue-800"
                                              : row.event_name === "impressions"
                                                ? "bg-purple-100 text-purple-800"
                                                : row.event_name === "revenue"
                                                  ? "bg-orange-100 text-orange-800"
                                                  : "bg-gray-100 text-gray-800"
                                        }
                                      >
                                        {row.event_name}
                                      </Badge>
                                    </TableCell>
                                    {viewMode === "campaign" && (
                                      <TableCell>
                                        <Badge
                                          variant="secondary"
                                          className={
                                            row.media_source === "facebook"
                                              ? "bg-blue-100 text-blue-800"
                                              : row.media_source === "google"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-gray-100 text-gray-800"
                                          }
                                        >
                                          {row.media_source}
                                        </Badge>
                                      </TableCell>
                                    )}
                                    {viewMode === "campaign" && (
                                      <TableCell className="font-medium text-xs" title={row.campaign}>
                                        {row.campaign.length > 30
                                          ? `${row.campaign.substring(0, 30)}...`
                                          : row.campaign}
                                      </TableCell>
                                    )}
                                    {viewMode === "media" && (
                                      <TableCell>
                                        <Badge
                                          variant="secondary"
                                          className={
                                            row.media_source === "facebook"
                                              ? "bg-blue-100 text-blue-800"
                                              : row.media_source === "google"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-gray-100 text-gray-800"
                                          }
                                        >
                                          {row.media_source}
                                        </Badge>
                                      </TableCell>
                                    )}
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                          {currentData.length === 0 && shouldShowData() && !isLoading && (
                            <div className="text-center py-8 text-gray-500">
                              <div className="text-lg font-medium mb-2">No se encontraron datos</div>
                              <p>No hay datos disponibles para los filtros seleccionados.</p>
                              <p className="text-sm mt-2">
                                Intenta seleccionar diferentes filtros o cambiar el modo de vista.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Chart */}
            {curvesGenerated && (
              <div className="xl:col-span-1">
                <SaturationChart
                  excludedCampaigns={excludedCampaigns}
                  excludedMedias={excludedMedias}
                  selectedMedia={selectedMedia}
                  selectedCampaign={selectedCampaign}
                  selectedGeos={selectedGeos}
                  selectedEventNames={selectedEventNames}
                  selectedKPI={selectedKPI}
                  viewMode={viewMode}
                />
              </div>
            )}

            {/* Placeholder for chart when not generated */}
            {!curvesGenerated && shouldShowData() && selectedKPI !== "" && (
              <div className="xl:col-span-1">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Curvas de Saturación</CardTitle>
                    <p className="text-sm text-gray-600">
                      Las curvas de saturación aparecerán aquí una vez que las generes
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-gray-500 h-full flex flex-col justify-center">
                      <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <div className="text-lg font-medium mb-2">Curvas de Saturación</div>
                      <p className="text-sm mb-4">
                        Haz clic en "Generar Curvas" para visualizar las curvas de saturación de {selectedKPI}
                      </p>
                      <p className="text-xs text-gray-400">
                        Las curvas mostrarán la relación entre inversión y {selectedKPI} para optimizar el presupuesto
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Configuration Modal */}
          <CurveConfigurationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onCreateCurve={handleCreateCurve}
            selectedMedia={selectedMedia}
            selectedCampaign={selectedCampaign}
            selectedGeos={selectedGeos}
            selectedEventNames={selectedEventNames}
            selectedKPI={selectedKPI}
            viewMode={viewMode}
            availableOptions={availableOptions}
          />
        </div>
      </div>
    </div>
  )
}
