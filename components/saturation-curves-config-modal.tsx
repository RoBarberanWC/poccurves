"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, Plus } from "lucide-react"
import { csvDataService } from "@/lib/csv-data-service"

interface SaturationCurvesConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (config: {
    budgetSource: "real" | "hypothetical"
    modelingScenario: "recurring" | "recurring-new" | "recurring-special" | "all"
    newCampaignPercentage: number
    showCurves: boolean
    selectedMedia: string
    selectedCampaign: string
    selectedGeos: string[]
    selectedEventNames: string[]
    selectedKPI: string
  }) => void
  currentConfig: {
    budgetSource: "real" | "hypothetical"
    modelingScenario: "recurring" | "recurring-new" | "recurring-special" | "all"
    newCampaignPercentage: number
    showCurves: boolean
    selectedMedia: string
    selectedCampaign: string
    selectedGeos: string[]
    selectedEventNames: string[]
    selectedKPI: string
  }
  hasNewCampaigns: boolean
  hasSpecialDates: boolean
}

const mockKPIs = [
  { value: "CPA", label: "CPA" },
  { value: "ROAS", label: "ROAS" },
  { value: "CPR", label: "CPR" },
  { value: "CPC", label: "CPC" },
  { value: "CPM", label: "CPM" },
]

export function SaturationCurvesConfigModal({
  isOpen,
  onClose,
  onApply,
  currentConfig,
  hasNewCampaigns,
  hasSpecialDates,
}: SaturationCurvesConfigModalProps) {
  const [budgetSource, setBudgetSource] = useState<"real" | "hypothetical">(currentConfig.budgetSource)
  const [modelingScenario, setModelingScenario] = useState(currentConfig.modelingScenario)
  const [newCampaignPercentage, setNewCampaignPercentage] = useState(currentConfig.newCampaignPercentage)
  const [selectedMedia, setSelectedMedia] = useState<string[]>([])
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])
  const [selectedGeo, setSelectedGeo] = useState<string[]>([])
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [selectedKPI, setSelectedKPI] = useState<string>(currentConfig.selectedKPI)
  const [budgetFile, setBudgetFile] = useState<File | null>(null)
  const [manualBudgets, setManualBudgets] = useState<Array<{ media: string; budget: number }>>([])

  // CSV data options
  const [csvOptions, setCsvOptions] = useState({
    mediaSources: [] as Array<{ value: string; label: string; campaignCount: number }>,
    countries: [] as Array<{ value: string; label: string; campaignCount: number }>,
    campaigns: [] as Array<{ value: string; label: string; mediaSource: string; country: string }>,
    events: [] as Array<{ value: string; label: string }>,
  })
  const [availableCampaigns, setAvailableCampaigns] = useState<
    Array<{ value: string; label: string; mediaSource: string; country: string }>
  >([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Load CSV data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCSVData()
    }
  }, [isOpen])

  // Update available campaigns when media selection changes
  useEffect(() => {
    updateAvailableCampaigns()
  }, [selectedMedia, csvOptions.campaigns])

  const loadCSVData = async () => {
    setIsLoadingData(true)
    try {
      const [mediaSources, countries, campaignDetails, uniqueValues] = await Promise.all([
        csvDataService.getMediaSourcesWithCounts(),
        csvDataService.getCountriesWithCounts(),
        csvDataService.getCampaignDetails(),
        csvDataService.getUniqueValues(),
      ])

      setCsvOptions({
        mediaSources: mediaSources.map((m) => ({
          value: m.name.toLowerCase(),
          label: m.name,
          campaignCount: m.campaignCount,
        })),
        countries: countries.map((c) => ({
          value: c.name,
          label: c.name,
          campaignCount: c.campaignCount,
        })),
        campaigns: campaignDetails.map((c) => ({
          value: c.name,
          label: c.name,
          mediaSource: c.mediaSource,
          country: c.country,
        })),
        events: [
          { value: "conversions", label: "Conversions" },
          { value: "revenue", label: "Revenue" },
          { value: "clicks", label: "Clicks" },
          { value: "impressions", label: "Impressions" },
        ],
      })
    } catch (error) {
      console.error("Error loading CSV data:", error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const updateAvailableCampaigns = () => {
    let filtered = csvOptions.campaigns

    if (selectedMedia.length > 0) {
      filtered = filtered.filter((campaign) =>
        selectedMedia.some((media) => campaign.mediaSource.toLowerCase() === media.toLowerCase()),
      )
    }

    setAvailableCampaigns(filtered)

    // Reset campaign selection if current campaigns are not available
    const validCampaigns = selectedCampaigns.filter((campaign) =>
      filtered.some((available) => available.value === campaign),
    )
    if (validCampaigns.length !== selectedCampaigns.length) {
      setSelectedCampaigns(validCampaigns)
    }
  }

  const getScenarioOptions = () => {
    const options = [
      { value: "recurring", label: "Solo campañas recurrentes", available: true },
      {
        value: "recurring-new",
        label: `Recurrentes + ${newCampaignPercentage}% nuevas`,
        available: hasNewCampaigns,
      },
      {
        value: "recurring-special",
        label: "Recurrentes + Special Dates",
        available: hasSpecialDates,
      },
      {
        value: "all",
        label: `Todas + ${newCampaignPercentage}% nuevas`,
        available: hasNewCampaigns && hasSpecialDates,
      },
    ]

    return options.filter((option) => option.available)
  }

  const handleApply = () => {
    onApply({
      budgetSource,
      modelingScenario,
      newCampaignPercentage,
      showCurves: true,
      selectedMedia: selectedMedia.length > 0 ? selectedMedia[0] : "All Media",
      selectedCampaign: selectedCampaigns.length > 0 ? selectedCampaigns[0] : "All Campaigns",
      selectedGeos: selectedGeo,
      selectedEventNames: selectedEvents,
      selectedKPI,
    })
    onClose()
  }

  const handleReset = () => {
    setBudgetSource("real")
    setModelingScenario("recurring")
    setNewCampaignPercentage(15)
    setSelectedMedia([])
    setSelectedCampaigns([])
    setSelectedGeo([])
    setSelectedEvents([])
    setSelectedKPI("")
    setBudgetFile(null)
    setManualBudgets([])
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setBudgetFile(file)
    }
  }

  const addManualBudget = () => {
    setManualBudgets([...manualBudgets, { media: "", budget: 0 }])
  }

  const updateManualBudget = (index: number, field: "media" | "budget", value: string | number) => {
    const updated = [...manualBudgets]
    updated[index] = { ...updated[index], [field]: value }
    setManualBudgets(updated)
  }

  const removeManualBudget = (index: number) => {
    setManualBudgets(manualBudgets.filter((_, i) => i !== index))
  }

  if (isLoadingData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold" style={{ fontFamily: "Judson, serif" }}>
              Configurar Curvas de Saturación
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Cargando datos del CSV...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold" style={{ fontFamily: "Judson, serif" }}>
            Configurar Curvas de Saturación
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Budget Source Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Fuente de Presupuesto</Label>
            <RadioGroup value={budgetSource} onValueChange={(value: "real" | "hypothetical") => setBudgetSource(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="real" id="real" />
                <Label htmlFor="real">Spend Real (usar datos históricos)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hypothetical" id="hypothetical" />
                <Label htmlFor="hypothetical">Budget Hipotético Manual</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Budget Upload Section - Only show when hypothetical is selected */}
          {budgetSource === "hypothetical" && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Cargar Información de Presupuesto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload Option */}
                <div className="space-y-2">
                  <Label className="font-medium">Opción 1: Subir desde Excel/CSV</Label>
                  <div className="flex items-center space-x-2">
                    <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="flex-1" />
                    {budgetFile && (
                      <div className="flex items-center text-sm text-green-600">
                        <FileText className="w-4 h-4 mr-1" />
                        {budgetFile.name}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    Formato requerido: Media, Presupuesto, Geo (opcional), Evento (opcional)
                  </p>
                </div>

                {/* Manual Entry Option */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Opción 2: Entrada Manual</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addManualBudget}>
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                  {manualBudgets.map((budget, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Select value={budget.media} onValueChange={(value) => updateManualBudget(index, "media", value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Media" />
                        </SelectTrigger>
                        <SelectContent>
                          {csvOptions.mediaSources.map((media) => (
                            <SelectItem key={media.value} value={media.value}>
                              {media.label} ({media.campaignCount} campañas)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Presupuesto"
                        value={budget.budget || ""}
                        onChange={(e) => updateManualBudget(index, "budget", Number(e.target.value))}
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => removeManualBudget(index)}>
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Modeling Scenario */}
          <div className="space-y-2">
            <Label htmlFor="scenario">Escenario de Modelado</Label>
            <Select value={modelingScenario} onValueChange={(value: any) => setModelingScenario(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar escenario..." />
              </SelectTrigger>
              <SelectContent>
                {getScenarioOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* New Campaign Percentage - Only show for relevant scenarios */}
          {(modelingScenario === "recurring-new" || modelingScenario === "all") && (
            <div className="space-y-2">
              <Label htmlFor="percentage">Porcentaje para Nuevas Campañas (%)</Label>
              <Input
                id="percentage"
                type="number"
                min="0"
                max="100"
                value={newCampaignPercentage}
                onChange={(e) => setNewCampaignPercentage(Number(e.target.value))}
              />
            </div>
          )}

          {/* Media Filter */}
          <div className="space-y-2">
            <Label htmlFor="media">Media</Label>
            <MultiSelect
              options={csvOptions.mediaSources.map((m) => ({
                value: m.value,
                label: `${m.label} (${m.campaignCount} campañas)`,
              }))}
              value={selectedMedia}
              onChange={setSelectedMedia}
              placeholder="Seleccionar canales de media..."
            />
          </div>

          {/* Campaign Filter */}
          <div className="space-y-2">
            <Label htmlFor="campaigns">Campañas</Label>
            <MultiSelect
              options={availableCampaigns.map((c) => ({
                value: c.value,
                label: `${c.label} (${c.mediaSource} - ${c.country})`,
              }))}
              value={selectedCampaigns}
              onChange={setSelectedCampaigns}
              placeholder={selectedMedia.length === 0 ? "Seleccionar media primero..." : "Seleccionar campañas..."}
              disabled={selectedMedia.length === 0}
            />
          </div>

          {/* Geo Filter */}
          <div className="space-y-2">
            <Label htmlFor="geo">Geografía</Label>
            <MultiSelect
              options={csvOptions.countries.map((c) => ({
                value: c.value,
                label: `${c.label} (${c.campaignCount} campañas)`,
              }))}
              value={selectedGeo}
              onChange={setSelectedGeo}
              placeholder="Seleccionar regiones..."
            />
          </div>

          {/* Events Filter */}
          <div className="space-y-2">
            <Label htmlFor="events">Eventos</Label>
            <MultiSelect
              options={csvOptions.events}
              value={selectedEvents}
              onChange={setSelectedEvents}
              placeholder="Seleccionar eventos..."
            />
          </div>

          {/* KPI Selector */}
          <div className="space-y-2">
            <Label htmlFor="kpi">KPI *</Label>
            <Select value={selectedKPI} onValueChange={setSelectedKPI}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar KPI..." />
              </SelectTrigger>
              <SelectContent>
                {mockKPIs.map((kpi) => (
                  <SelectItem key={kpi.value} value={kpi.value}>
                    {kpi.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleReset}>
              Resetear Filtros
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleApply}
                disabled={
                  !selectedKPI || (budgetSource === "hypothetical" && !budgetFile && manualBudgets.length === 0)
                }
                className="bg-purple-600 hover:bg-purple-700"
              >
                Configurar Curvas
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
