"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, BarChart3, Loader2, Download, AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react"
import { SaturationCurveChart } from "./saturation-curve-chart"
import { csvDataService, type SaturationCurveData, type ValidationResult } from "@/lib/csv-data-service"

interface SaturationCurvesModalProps {
  isOpen: boolean
  onClose: () => void
  selectedGeos?: string[]
  selectedEventNames?: string[]
  selectedKPI?: string
  saturationConfig?: {
    budgetSource: "real" | "hypothetical"
    modelingScenario: "recurring" | "recurring-new" | "recurring-special" | "all"
    newCampaignPercentage: number
    showCurves: boolean
    selectedMedia?: string
    selectedCampaign?: string
    selectedGeos?: string[]
    selectedEventNames?: string[]
    selectedKPI?: string
  }
  config?: {
    media: string[]
    campaigns: string[]
    geo: string[]
    events: string[]
    kpi: string
  } | null
}

export function SaturationCurvesModal({
  isOpen,
  onClose,
  selectedGeos = [],
  selectedEventNames = [],
  selectedKPI = "",
  saturationConfig,
  config,
}: SaturationCurvesModalProps) {
  const [curveData, setCurveData] = useState<{
    overall: SaturationCurveData
    byMedia: SaturationCurveData[]
    byCampaign: SaturationCurveData[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRegressionTable, setShowRegressionTable] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingStage, setLoadingStage] = useState("")
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [showDataQuality, setShowDataQuality] = useState(false)

  // Use config if available, otherwise fall back to saturationConfig
  const activeConfig = config || {
    media: saturationConfig?.selectedMedia ? [saturationConfig.selectedMedia] : [],
    campaigns: saturationConfig?.selectedCampaign ? [saturationConfig.selectedCampaign] : [],
    geo: saturationConfig?.selectedGeos || selectedGeos,
    events: saturationConfig?.selectedEventNames || selectedEventNames,
    kpi: saturationConfig?.selectedKPI || selectedKPI,
  }

  // Generate curves when modal opens or config changes
  useEffect(() => {
    if (isOpen && activeConfig.kpi) {
      generateCurves()
    }
  }, [isOpen, activeConfig])

  const generateCurves = async () => {
    setIsLoading(true)
    setError(null)
    setLoadingProgress(0)
    setLoadingStage("Iniciando...")

    try {
      // Get validation result
      setLoadingStage("Validando datos...")
      setLoadingProgress(10)

      const validation = csvDataService.getValidationResult()
      setValidationResult(validation)

      if (validation && !validation.isValid) {
        throw new Error(`Datos inválidos: ${validation.errors.join(", ")}`)
      }

      // Progress simulation with realistic stages
      const stages = [
        { progress: 20, stage: "Cargando datos CSV..." },
        { progress: 40, stage: "Pre-agregando datos..." },
        { progress: 60, stage: "Aplicando filtros..." },
        { progress: 80, stage: "Calculando regresiones..." },
        { progress: 95, stage: "Generando curvas..." },
      ]

      let currentStage = 0
      const progressInterval = setInterval(() => {
        if (currentStage < stages.length) {
          setLoadingProgress(stages[currentStage].progress)
          setLoadingStage(stages[currentStage].stage)
          currentStage++
        }
      }, 800)

      const curves = await csvDataService.generateSaturationCurves(activeConfig)

      clearInterval(progressInterval)
      setLoadingProgress(100)
      setLoadingStage("Completado")

      // Small delay to show completion
      setTimeout(() => {
        setCurveData(curves)
        setIsLoading(false)
      }, 500)
    } catch (err) {
      console.error("Error generating curves:", err)

      // User-friendly error messages
      let errorMessage = "Error desconocido al generar las curvas"

      if (err instanceof Error) {
        if (err.message.includes("fetch") || err.message.includes("network")) {
          errorMessage = "Error de conexión. Verifica tu internet e intenta nuevamente."
        } else if (err.message.includes("CSV") || err.message.includes("datos")) {
          errorMessage = `Error en los datos: ${err.message}`
        } else if (err.message.includes("columna") || err.message.includes("column")) {
          errorMessage = `Error de formato: ${err.message}`
        } else if (err.message.includes("memoria") || err.message.includes("memory")) {
          errorMessage = "Dataset muy grande. Intenta aplicar más filtros para reducir los datos."
        } else {
          errorMessage = err.message
        }
      }

      setError(errorMessage)
      setIsLoading(false)
    }
  }

  const getKPILabel = (kpi: string) => {
    const kpiLabels: Record<string, string> = {
      roas: "ROAS",
      cpa: "CPA",
      cpc: "CPC",
      cpm: "CPM",
      cpr: "CPR",
      conversions: "Conversions",
      revenue: "Revenue",
      clicks: "Clicks",
      impressions: "Impressions",
      CPA: "CPA",
      ROAS: "ROAS",
      CPR: "CPR",
      CPC: "CPC",
      CPM: "CPM",
    }
    return kpiLabels[kpi] || kpi
  }

  const getFilterSummary = () => {
    const filters = []
    if (activeConfig.media.length > 0) {
      filters.push(`${activeConfig.media.length} media${activeConfig.media.length > 1 ? "s" : ""}`)
    }
    if (activeConfig.campaigns.length > 0) {
      filters.push(`${activeConfig.campaigns.length} campaña${activeConfig.campaigns.length > 1 ? "s" : ""}`)
    }
    if (activeConfig.geo.length > 0) {
      filters.push(`${activeConfig.geo.length} geo${activeConfig.geo.length > 1 ? "s" : ""}`)
    }
    if (activeConfig.events.length > 0) {
      filters.push(`${activeConfig.events.length} evento${activeConfig.events.length > 1 ? "s" : ""}`)
    }
    return filters.join(", ")
  }

  const exportRegressionParams = () => {
    if (!curveData) return

    const allCurves = [curveData.overall, ...curveData.byMedia, ...curveData.byCampaign].filter(
      (curve) => curve.regressionParams,
    )

    let csvContent = "Curve,Ln,Constant,R_Squared,Formula\n"
    allCurves.forEach((curve) => {
      if (curve.regressionParams) {
        const ln = curve.regressionParams.ln.toFixed(4)
        const constant = curve.regressionParams.constant.toFixed(4)
        const rSquared = curve.regressionParams.rSquared.toFixed(4)
        const formula = `${activeConfig.kpi} = ${ln} * ln(spend) + ${constant}`
        csvContent += `"${curve.name}",${ln},${constant},${rSquared},"${formula}"\n`
      }
    })

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `saturation_curves_parameters_${activeConfig.kpi}_${new Date().toISOString().split("T")[0]}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getDataQualityIcon = (validation: ValidationResult) => {
    if (!validation.isValid) return <AlertCircle className="w-4 h-4 text-red-500" />
    if (validation.warnings.length > 0) return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    return <CheckCircle className="w-4 h-4 text-green-500" />
  }

  const getDataQualityColor = (validation: ValidationResult) => {
    if (!validation.isValid) return "border-red-200 bg-red-50"
    if (validation.warnings.length > 0) return "border-yellow-200 bg-yellow-50"
    return "border-green-200 bg-green-50"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <DialogTitle className="text-xl font-semibold" style={{ fontFamily: "Judson, serif" }}>
              Curvas de Saturación - {getKPILabel(activeConfig.kpi)}
            </DialogTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        {/* Data Quality Indicator */}
        {validationResult && (
          <div className={`mb-4 p-3 rounded-lg border ${getDataQualityColor(validationResult)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getDataQualityIcon(validationResult)}
                <span className="font-medium text-sm">
                  Calidad de datos: {validationResult.isValid ? "Válido" : "Problemas detectados"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDataQuality(!showDataQuality)}
                  className="text-xs h-6 px-2"
                >
                  {showDataQuality ? "Ocultar" : "Ver detalles"}
                </Button>
              </div>
              <div className="text-xs text-gray-600">
                {validationResult.dataQuality.validRows}/{validationResult.dataQuality.totalRows} filas válidas
              </div>
            </div>

            {showDataQuality && (
              <div className="mt-3 space-y-2">
                {validationResult.errors.length > 0 && (
                  <div className="text-sm">
                    <div className="font-medium text-red-700 mb-1">Errores:</div>
                    <ul className="list-disc list-inside text-red-600 space-y-1">
                      {validationResult.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validationResult.warnings.length > 0 && (
                  <div className="text-sm">
                    <div className="font-medium text-yellow-700 mb-1">Advertencias:</div>
                    <ul className="list-disc list-inside text-yellow-600 space-y-1">
                      {validationResult.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-xs">
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="font-bold text-lg">{validationResult.dataQuality.totalRows}</div>
                    <div className="text-gray-600">Total filas</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="font-bold text-lg text-green-600">{validationResult.dataQuality.validRows}</div>
                    <div className="text-gray-600">Filas válidas</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="font-bold text-lg text-orange-600">
                      {validationResult.dataQuality.emptySpendRows}
                    </div>
                    <div className="text-gray-600">Sin spend</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="font-bold text-lg text-red-600">{validationResult.dataQuality.emptyEventRows}</div>
                    <div className="text-gray-600">Sin eventos</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              KPI: {getKPILabel(activeConfig.kpi)}
            </Badge>
            {activeConfig.media.length > 0 && <Badge variant="outline">Media: {activeConfig.media.join(", ")}</Badge>}
            {activeConfig.campaigns.length > 0 && (
              <Badge variant="outline">Campaigns: {activeConfig.campaigns.length} selected</Badge>
            )}
            {activeConfig.geo.length > 0 && <Badge variant="outline">Geo: {activeConfig.geo.join(", ")}</Badge>}
            {activeConfig.events.length > 0 && (
              <Badge variant="outline">Events: {activeConfig.events.join(", ")}</Badge>
            )}
          </div>
          {getFilterSummary() && <p className="text-sm text-gray-600 mt-2">Filtros aplicados: {getFilterSummary()}</p>}
        </div>

        {/* Downsampling Warning */}
        {!isLoading &&
          !error &&
          curveData &&
          (curveData.overall.isDownsampled ||
            curveData.byMedia.some((c) => c.isDownsampled) ||
            curveData.byCampaign.some((c) => c.isDownsampled)) && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Curva optimizada para alto volumen de datos</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Se aplicó downsampling para mejorar el rendimiento manteniendo la forma general de la curva.
              </p>
            </div>
          )}

        {/* Regression Parameters Toggle */}
        {!isLoading && !error && curveData && (
          <div className="mb-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRegressionTable(!showRegressionTable)}
                className="text-xs"
              >
                {showRegressionTable ? "Ocultar parámetros" : "Ver parámetros de regresión"}
              </Button>
              {showRegressionTable && (
                <Button variant="outline" size="sm" onClick={exportRegressionParams} className="text-xs bg-transparent">
                  <Download className="w-3 h-3 mr-1" />
                  Exportar CSV
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Regression Parameters Table */}
        {showRegressionTable && !isLoading && !error && curveData && (
          <div className="mb-6 overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-200 px-4 py-2 text-left">Curva</th>
                  <th className="border border-gray-200 px-4 py-2 text-right">Ln</th>
                  <th className="border border-gray-200 px-4 py-2 text-right">Constante</th>
                  <th className="border border-gray-200 px-4 py-2 text-right">R²</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Fórmula</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-4 py-2">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: curveData.overall.color }}
                      ></div>
                      {curveData.overall.name}
                    </div>
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-right font-mono">
                    {curveData.overall.regressionParams ? curveData.overall.regressionParams.ln.toFixed(4) : "N/A"}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-right font-mono">
                    {curveData.overall.regressionParams
                      ? curveData.overall.regressionParams.constant.toFixed(4)
                      : "N/A"}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-right font-mono">
                    {curveData.overall.regressionParams
                      ? curveData.overall.regressionParams.rSquared.toFixed(4)
                      : "N/A"}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 font-mono text-xs">
                    {curveData.overall.regressionParams
                      ? `${activeConfig.kpi} = ${curveData.overall.regressionParams.ln.toFixed(
                          2,
                        )} * ln(spend) + ${curveData.overall.regressionParams.constant.toFixed(2)}`
                      : "N/A"}
                  </td>
                </tr>
                {curveData.byMedia.map((curve) => (
                  <tr key={`media-${curve.name}`}>
                    <td className="border border-gray-200 px-4 py-2">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: curve.color }}></div>
                        {curve.name} (Media)
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-right font-mono">
                      {curve.regressionParams ? curve.regressionParams.ln.toFixed(4) : "N/A"}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-right font-mono">
                      {curve.regressionParams ? curve.regressionParams.constant.toFixed(4) : "N/A"}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-right font-mono">
                      {curve.regressionParams ? curve.regressionParams.rSquared.toFixed(4) : "N/A"}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 font-mono text-xs">
                      {curve.regressionParams
                        ? `${activeConfig.kpi} = ${curve.regressionParams.ln.toFixed(
                            2,
                          )} * ln(spend) + ${curve.regressionParams.constant.toFixed(2)}`
                        : "N/A"}
                    </td>
                  </tr>
                ))}
                {curveData.byCampaign.map((curve) => (
                  <tr key={`campaign-${curve.name}`}>
                    <td className="border border-gray-200 px-4 py-2">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: curve.color }}></div>
                        {curve.name} (Campaña)
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-right font-mono">
                      {curve.regressionParams ? curve.regressionParams.ln.toFixed(4) : "N/A"}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-right font-mono">
                      {curve.regressionParams ? curve.regressionParams.constant.toFixed(4) : "N/A"}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-right font-mono">
                      {curve.regressionParams ? curve.regressionParams.rSquared.toFixed(4) : "N/A"}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 font-mono text-xs">
                      {curve.regressionParams
                        ? `${activeConfig.kpi} = ${curve.regressionParams.ln.toFixed(
                            2,
                          )} * ln(spend) + ${curve.regressionParams.constant.toFixed(2)}`
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Enhanced Loading State with Progress */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-4" />
            <div className="text-center">
              <div className="text-gray-600 mb-2">{loadingStage}</div>
              <div className="w-80 bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className="bg-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-500">{loadingProgress}% completado</div>

              {/* Stage-specific tips */}
              <div className="text-xs text-gray-400 mt-2 max-w-md">
                {loadingProgress < 20 && "Verificando la estructura del archivo CSV..."}
                {loadingProgress >= 20 && loadingProgress < 40 && "Descargando y parseando datos del servidor..."}
                {loadingProgress >= 40 && loadingProgress < 60 && "Optimizando datos para consultas rápidas..."}
                {loadingProgress >= 60 && loadingProgress < 80 && "Aplicando filtros seleccionados..."}
                {loadingProgress >= 80 && loadingProgress < 95 && "Calculando parámetros de regresión logarítmica..."}
                {loadingProgress >= 95 && "Finalizando generación de curvas..."}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Error State */}
        {error && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <div className="text-red-600 mb-4 max-w-md mx-auto">{error}</div>

            {/* Error-specific suggestions */}
            <div className="text-sm text-gray-600 mb-4 max-w-lg mx-auto">
              {error.includes("conexión") && (
                <p>💡 Sugerencia: Verifica tu conexión a internet y que no haya restricciones de firewall.</p>
              )}
              {error.includes("datos") && (
                <p>
                  💡 Sugerencia: El archivo CSV puede tener formato incorrecto. Verifica que tenga las columnas
                  requeridas.
                </p>
              )}
              {error.includes("memoria") && (
                <p>💡 Sugerencia: Aplica más filtros para reducir el volumen de datos a procesar.</p>
              )}
              {error.includes("columna") && (
                <p>
                  💡 Sugerencia: Verifica que el CSV tenga las columnas: campaign_name, original_spend, summary_week,
                  media_source.
                </p>
              )}
            </div>

            <div className="space-x-2">
              <Button onClick={generateCurves} variant="outline">
                Reintentar
              </Button>
              <Button onClick={() => csvDataService.clearCache()} variant="ghost" className="text-xs">
                Limpiar caché
              </Button>
              <Button onClick={onClose} variant="ghost">
                Cerrar
              </Button>
            </div>
          </div>
        )}

        {/* Curves Content */}
        {!isLoading && !error && curveData && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="by-media">By Media</TabsTrigger>
              <TabsTrigger value="by-campaign">By Campaign</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="bg-white rounded-lg border p-6">
                <SaturationCurveChart
                  data={[curveData.overall]}
                  kpi={activeConfig.kpi}
                  title="Curva de Saturación General"
                  height={400}
                  showProjection={true}
                />

                {/* Enhanced Summary Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ${curveData.overall.totalSpend.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Inversión Total</div>
                    {curveData.overall.isDownsampled && <div className="text-xs text-blue-600 mt-1">Optimizado</div>}
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {curveData.overall.totalEvents.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Eventos Totales</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {activeConfig.kpi === "ROAS" ? `${curveData.overall.avgKPI}x` : `$${curveData.overall.avgKPI}`}
                    </div>
                    <div className="text-sm text-gray-600">{activeConfig.kpi} Promedio</div>
                    {curveData.overall.regressionParams && (
                      <div className="text-xs text-gray-500 mt-1">
                        R² = {curveData.overall.regressionParams.rSquared.toFixed(3)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="by-media" className="space-y-6">
              <div className="bg-white rounded-lg border p-6">
                {curveData.byMedia.length > 0 ? (
                  <SaturationCurveChart
                    data={curveData.byMedia}
                    kpi={activeConfig.kpi}
                    title="Curvas de Saturación por Media"
                    height={400}
                    showProjection={true}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg font-medium mb-2">No hay datos por media</p>
                    <p>No se encontraron datos suficientes para generar curvas por fuente de medios.</p>
                    <p className="text-sm mt-2">
                      Intenta reducir los filtros o seleccionar un rango de datos más amplio.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="by-campaign" className="space-y-6">
              <div className="bg-white rounded-lg border p-6">
                {curveData.byCampaign.length > 0 ? (
                  <>
                    <SaturationCurveChart
                      data={curveData.byCampaign}
                      kpi={activeConfig.kpi}
                      title={`Curvas de Saturación por Campaña (Top ${curveData.byCampaign.length})`}
                      height={400}
                      showProjection={true}
                    />
                    <div className="mt-4 text-sm text-gray-600">
                      <p>
                        Mostrando las {curveData.byCampaign.length} campañas con mayor inversión total
                        {curveData.byCampaign.some((c) => c.isDownsampled) && " (optimizado para rendimiento)"}.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg font-medium mb-2">No hay datos por campaña</p>
                    <p>No se encontraron datos suficientes para generar curvas por campaña.</p>
                    <p className="text-sm mt-2">Intenta seleccionar una media específica o reducir otros filtros.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Empty State */}
        {!isLoading && !error && !curveData && (
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No hay configuración de curvas</p>
            <p>Configura los filtros y KPI para generar las curvas de saturación.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
