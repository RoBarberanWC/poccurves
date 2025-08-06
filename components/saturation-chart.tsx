"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Campaign data for individual campaigns - updated with different KPI values
const campaignData = {
  "Facebook US": {
    color: "#1877F2",
    mediaSource: "Facebook",
    cpa: [
      { x: 5000, y: 45.2 },
      { x: 10000, y: 52.1 },
      { x: 15000, y: 58.7 },
      { x: 20000, y: 67.3 },
      { x: 25000, y: 78.9 },
      { x: 30000, y: 95.4 },
    ],
    roas: [
      { x: 5000, y: 2.8 },
      { x: 10000, y: 3.2 },
      { x: 15000, y: 3.6 },
      { x: 20000, y: 3.9 },
      { x: 25000, y: 4.1 },
      { x: 30000, y: 4.3 },
    ],
    cpr: [
      { x: 5000, y: 45.2 },
      { x: 10000, y: 52.1 },
      { x: 15000, y: 58.7 },
      { x: 20000, y: 67.3 },
      { x: 25000, y: 78.9 },
      { x: 30000, y: 95.4 },
    ],
  },
  "Google CA": {
    color: "#EA4335",
    mediaSource: "Google",
    cpa: [
      { x: 3000, y: 42.8 },
      { x: 6000, y: 48.3 },
      { x: 9000, y: 55.2 },
      { x: 12000, y: 63.7 },
      { x: 15000, y: 74.1 },
      { x: 18000, y: 87.6 },
    ],
    roas: [
      { x: 3000, y: 2.5 },
      { x: 6000, y: 2.9 },
      { x: 9000, y: 3.3 },
      { x: 12000, y: 3.7 },
      { x: 15000, y: 4.0 },
      { x: 18000, y: 4.2 },
    ],
    cpr: [
      { x: 3000, y: 42.8 },
      { x: 6000, y: 48.3 },
      { x: 9000, y: 55.2 },
      { x: 12000, y: 63.7 },
      { x: 15000, y: 74.1 },
      { x: 18000, y: 87.6 },
    ],
  },
  "TikTok UK": {
    color: "#000000",
    mediaSource: "TikTok",
    cpa: [
      { x: 4000, y: 38.9 },
      { x: 8000, y: 44.1 },
      { x: 12000, y: 51.3 },
      { x: 16000, y: 59.8 },
      { x: 20000, y: 70.2 },
      { x: 24000, y: 83.7 },
    ],
    roas: [
      { x: 4000, y: 2.7 },
      { x: 8000, y: 3.1 },
      { x: 12000, y: 3.5 },
      { x: 16000, y: 3.8 },
      { x: 20000, y: 4.0 },
      { x: 24000, y: 4.2 },
    ],
    cpr: [
      { x: 4000, y: 38.9 },
      { x: 8000, y: 44.1 },
      { x: 12000, y: 51.3 },
      { x: 16000, y: 59.8 },
      { x: 20000, y: 70.2 },
      { x: 24000, y: 83.7 },
    ],
  },
  "Instagram Holiday": {
    color: "#E4405F",
    mediaSource: "Instagram",
    cpa: [
      { x: 2000, y: 41.2 },
      { x: 4000, y: 46.8 },
      { x: 6000, y: 54.1 },
      { x: 8000, y: 63.9 },
      { x: 10000, y: 76.4 },
    ],
    roas: [
      { x: 2000, y: 1.8 },
      { x: 4000, y: 2.1 },
      { x: 6000, y: 2.4 },
      { x: 8000, y: 2.7 },
      { x: 10000, y: 2.9 },
    ],
    cpr: null, // No registration data for leads
  },
  "Facebook CA": {
    color: "#4267B2",
    mediaSource: "Facebook",
    cpa: [
      { x: 3000, y: 43.5 },
      { x: 6000, y: 49.2 },
      { x: 9000, y: 56.8 },
      { x: 12000, y: 65.4 },
      { x: 15000, y: 76.1 },
    ],
    roas: [
      { x: 3000, y: 3.2 },
      { x: 6000, y: 3.6 },
      { x: 9000, y: 4.0 },
      { x: 12000, y: 4.3 },
      { x: 15000, y: 4.5 },
    ],
    cpr: null, // Purchase campaign, no registration data
  },
  "Google UK": {
    color: "#DB4437",
    mediaSource: "Google",
    cpa: [
      { x: 2500, y: 40.1 },
      { x: 5000, y: 45.7 },
      { x: 7500, y: 52.3 },
      { x: 10000, y: 60.9 },
      { x: 12500, y: 71.5 },
    ],
    roas: [
      { x: 2500, y: 3.0 },
      { x: 5000, y: 3.4 },
      { x: 7500, y: 3.8 },
      { x: 10000, y: 4.1 },
      { x: 12500, y: 4.4 },
    ],
    cpr: null, // Purchase campaign, no registration data
  },
  "Facebook MX": {
    color: "#1877F2",
    mediaSource: "Facebook",
    cpa: [
      { x: 4000, y: 48.2 },
      { x: 8000, y: 54.1 },
      { x: 12000, y: 61.7 },
      { x: 16000, y: 70.3 },
      { x: 20000, y: 81.9 },
    ],
    roas: [
      { x: 4000, y: 2.6 },
      { x: 8000, y: 3.0 },
      { x: 12000, y: 3.4 },
      { x: 16000, y: 3.7 },
      { x: 20000, y: 3.9 },
    ],
    cpr: [
      { x: 4000, y: 48.2 },
      { x: 8000, y: 54.1 },
      { x: 12000, y: 61.7 },
      { x: 16000, y: 70.3 },
      { x: 20000, y: 81.9 },
    ],
  },
  "Google BR": {
    color: "#EA4335",
    mediaSource: "Google",
    cpa: [
      { x: 3500, y: 46.8 },
      { x: 7000, y: 52.3 },
      { x: 10500, y: 59.2 },
      { x: 14000, y: 67.7 },
      { x: 17500, y: 78.1 },
    ],
    roas: [
      { x: 3500, y: 3.1 },
      { x: 7000, y: 3.5 },
      { x: 10500, y: 3.9 },
      { x: 14000, y: 4.2 },
      { x: 17500, y: 4.4 },
    ],
    cpr: null, // Purchase campaign, no registration data
  },
}

// Aggregated media data with different KPIs
const mediaData = {
  Facebook: {
    color: "#1877F2",
    cpa: [
      { x: 8000, y: 44.3 },
      { x: 16000, y: 50.6 },
      { x: 24000, y: 57.7 },
      { x: 32000, y: 66.3 },
      { x: 40000, y: 77.5 },
      { x: 48000, y: 91.2 },
    ],
    roas: [
      { x: 8000, y: 2.9 },
      { x: 16000, y: 3.3 },
      { x: 24000, y: 3.7 },
      { x: 32000, y: 4.0 },
      { x: 40000, y: 4.2 },
      { x: 48000, y: 4.4 },
    ],
    cpr: [
      { x: 8000, y: 46.7 },
      { x: 16000, y: 53.1 },
      { x: 24000, y: 60.2 },
      { x: 32000, y: 68.8 },
      { x: 40000, y: 80.4 },
      { x: 48000, y: 95.7 },
    ],
  },
  Google: {
    color: "#EA4335",
    cpa: [
      { x: 5500, y: 41.4 },
      { x: 11000, y: 47.0 },
      { x: 16500, y: 53.7 },
      { x: 22000, y: 62.3 },
      { x: 27500, y: 72.8 },
      { x: 33000, y: 85.1 },
    ],
    roas: [
      { x: 5500, y: 2.8 },
      { x: 11000, y: 3.2 },
      { x: 16500, y: 3.6 },
      { x: 22000, y: 3.9 },
      { x: 27500, y: 4.1 },
      { x: 33000, y: 4.3 },
    ],
    cpr: [
      { x: 5500, y: 42.8 },
      { x: 11000, y: 48.3 },
      { x: 16500, y: 55.2 },
      { x: 22000, y: 63.7 },
      { x: 27500, y: 74.1 },
      { x: 33000, y: 87.6 },
    ],
  },
  TikTok: {
    color: "#000000",
    cpa: [
      { x: 4000, y: 38.9 },
      { x: 8000, y: 44.1 },
      { x: 12000, y: 51.3 },
      { x: 16000, y: 59.8 },
      { x: 20000, y: 70.2 },
      { x: 24000, y: 83.7 },
    ],
    roas: [
      { x: 4000, y: 2.7 },
      { x: 8000, y: 3.1 },
      { x: 12000, y: 3.5 },
      { x: 16000, y: 3.8 },
      { x: 20000, y: 4.0 },
      { x: 24000, y: 4.2 },
    ],
    cpr: [
      { x: 4000, y: 38.9 },
      { x: 8000, y: 44.1 },
      { x: 12000, y: 51.3 },
      { x: 16000, y: 59.8 },
      { x: 20000, y: 70.2 },
      { x: 24000, y: 83.7 },
    ],
  },
  Instagram: {
    color: "#E4405F",
    cpa: [
      { x: 2000, y: 41.2 },
      { x: 4000, y: 46.8 },
      { x: 6000, y: 54.1 },
      { x: 8000, y: 63.9 },
      { x: 10000, y: 76.4 },
    ],
    roas: [
      { x: 2000, y: 1.8 },
      { x: 4000, y: 2.1 },
      { x: 6000, y: 2.4 },
      { x: 8000, y: 2.7 },
      { x: 10000, y: 2.9 },
    ],
    cpr: null, // No registration data for leads
  },
}

interface SaturationChartProps {
  excludedCampaigns?: string[]
  excludedMedias?: string[]
  selectedMedia?: string
  selectedCampaign?: string
  selectedGeos?: string[]
  selectedEventNames?: string[]
  selectedKPI?: string
  viewMode?: "campaign" | "media"
}

export function SaturationChart({
  excludedCampaigns = [],
  excludedMedias = [],
  selectedMedia = "All Media",
  selectedCampaign = "All Campaigns",
  selectedGeos = [],
  selectedEventNames = [],
  selectedKPI = "CPA",
  viewMode = "campaign",
}: SaturationChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ campaign: string; point: { x: number; y: number } } | null>(null)

  // Get the curves to display based on view mode and filters
  const getCurvesToDisplay = () => {
    const kpiKey = selectedKPI.toLowerCase() as "cpa" | "roas" | "cpr"

    if (viewMode === "media") {
      // For media view, show aggregated media curve
      if (selectedMedia !== "All Media") {
        const media = mediaData[selectedMedia as keyof typeof mediaData]
        if (media && !excludedMedias.includes(selectedMedia)) {
          const points = media[kpiKey]
          if (points) {
            return [
              {
                name: selectedMedia,
                color: media.color,
                points: points,
              },
            ]
          }
        }
      }
      return []
    } else {
      // For campaign view, show individual campaign curve
      if (selectedCampaign !== "All Campaigns") {
        const campaign = campaignData[selectedCampaign as keyof typeof campaignData]
        if (campaign && !excludedCampaigns.includes(selectedCampaign)) {
          // Also check if the media is not excluded
          if (!excludedMedias.includes(campaign.mediaSource)) {
            const points = campaign[kpiKey]
            if (points) {
              return [
                {
                  name: selectedCampaign,
                  color: campaign.color,
                  points: points,
                },
              ]
            }
          }
        }
      }
      return []
    }
  }

  const curvesToDisplay = getCurvesToDisplay()

  // Calculate chart dimensions and scales
  const chartWidth = 800
  const chartHeight = 300
  const padding = 60

  // Get data ranges
  const allPoints = curvesToDisplay.flatMap((curve) => curve.points)

  if (allPoints.length === 0) {
    const isDataUnavailable =
      selectedKPI === "CPR" &&
      ((viewMode === "campaign" &&
        selectedCampaign !== "All Campaigns" &&
        campaignData[selectedCampaign as keyof typeof campaignData]?.cpr === null) ||
        (viewMode === "media" &&
          selectedMedia !== "All Media" &&
          mediaData[selectedMedia as keyof typeof mediaData]?.cpr === null))

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Curvas de Saturación - {selectedKPI}</CardTitle>
          <p className="text-sm text-gray-600">
            {isDataUnavailable
              ? `Datos de ${selectedKPI} no disponibles para la selección actual`
              : "No hay datos disponibles para los filtros seleccionados"}
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <div className="text-lg font-medium mb-2">
              {isDataUnavailable ? `${selectedKPI} no disponible` : "No hay datos de curvas disponibles"}
            </div>
            <p>
              {isDataUnavailable
                ? `La métrica ${selectedKPI} no está disponible para ${viewMode === "campaign" ? selectedCampaign : selectedMedia}. ${selectedKPI === "CPR" ? "Esta campaña no tiene eventos de registro." : ""}`
                : "Los filtros seleccionados no coinciden con ninguna campaña o media."}
            </p>
            <p className="text-sm mt-2">
              {isDataUnavailable
                ? "Intenta seleccionar un KPI diferente o una campaña/media que tenga datos para esta métrica."
                : "Intenta ajustar los filtros para ver las curvas de saturación."}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const minX = Math.min(...allPoints.map((p) => p.x))
  const maxX = Math.max(...allPoints.map((p) => p.x))
  const minY = Math.min(...allPoints.map((p) => p.y))
  const maxY = Math.max(...allPoints.map((p) => p.y))

  // Scale functions
  const scaleX = (x: number) => padding + ((x - minX) / (maxX - minX)) * (chartWidth - 2 * padding)
  const scaleY = (y: number) => chartHeight - padding - ((y - minY) / (maxY - minY)) * (chartHeight - 2 * padding)

  // Create path for each curve
  const createPath = (points: { x: number; y: number }[]) => {
    return points
      .map((point, index) => {
        const x = scaleX(point.x)
        const y = scaleY(point.y)
        return `${index === 0 ? "M" : "L"} ${x} ${y}`
      })
      .join(" ")
  }

  // Generate X-axis ticks
  const xTicks = []
  const tickCount = 6
  for (let i = 0; i <= tickCount; i++) {
    const value = minX + (maxX - minX) * (i / tickCount)
    xTicks.push({
      value,
      x: scaleX(value),
      label: `$${(value / 1000).toFixed(0)}K`,
    })
  }

  // Generate Y-axis ticks
  const yTicks = []
  for (let i = 0; i <= 5; i++) {
    const value = minY + (maxY - minY) * (i / 5)
    yTicks.push({
      value,
      y: scaleY(value),
      label: selectedKPI === "ROAS" ? `${value.toFixed(1)}x` : `$${value.toFixed(0)}`,
    })
  }

  // Determine chart title based on view mode and selection
  const getChartTitle = () => {
    let title = ""
    if (viewMode === "media") {
      title = `Curva de Saturación ${selectedKPI} - ${selectedMedia} (Agregada)`
    } else {
      title = `Curva de Saturación ${selectedKPI} - ${selectedCampaign}`
    }

    // Add filter information
    const filterInfo = []
    if (selectedGeos.length > 0) {
      filterInfo.push(`${selectedGeos.length} geo${selectedGeos.length > 1 ? "s" : ""}`)
    }
    if (selectedEventNames.length > 0) {
      filterInfo.push(`${selectedEventNames.length} evento${selectedEventNames.length > 1 ? "s" : ""}`)
    }

    if (filterInfo.length > 0) {
      title += ` (${filterInfo.join(", ")})`
    }

    return title
  }

  const getChartDescription = () => {
    let description = ""
    if (viewMode === "media") {
      description = `Visualización agregada de ${selectedKPI} para la media: ${selectedMedia}`
    } else {
      description = `Visualización individual de ${selectedKPI} para la campaña: ${selectedCampaign}`
    }

    // Add active filters description
    const activeFilters = []
    if (selectedGeos.length > 0) {
      activeFilters.push(`Geos: ${selectedGeos.join(", ")}`)
    }
    if (selectedEventNames.length > 0) {
      activeFilters.push(`Eventos: ${selectedEventNames.join(", ")}`)
    }

    if (activeFilters.length > 0) {
      description += ` | Filtros: ${activeFilters.join(" | ")}`
    }

    return description
  }

  // Get dynamic Y-axis label based on selected KPI
  const getYAxisLabel = () => {
    switch (selectedKPI) {
      case "CPA":
        return "CPA ($)"
      case "ROAS":
        return "ROAS (x)"
      case "CPR":
        return "CPR ($)"
      default:
        return "KPI"
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{getChartTitle()}</CardTitle>
        <p className="text-sm text-gray-600">{getChartDescription()}</p>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* SVG Chart */}
          <svg width={chartWidth} height={chartHeight} className="border border-gray-200 rounded">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#e0e0e0" strokeWidth="1" strokeDasharray="2,2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* X-axis */}
            <line
              x1={padding}
              y1={chartHeight - padding}
              x2={chartWidth - padding}
              y2={chartHeight - padding}
              stroke="#666"
              strokeWidth="1"
            />

            {/* Y-axis */}
            <line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="#666" strokeWidth="1" />

            {/* X-axis ticks and labels */}
            {xTicks.map((tick, index) => (
              <g key={index}>
                <line
                  x1={tick.x}
                  y1={chartHeight - padding}
                  x2={tick.x}
                  y2={chartHeight - padding + 5}
                  stroke="#666"
                  strokeWidth="1"
                />
                <text x={tick.x} y={chartHeight - padding + 20} textAnchor="middle" fontSize="12" fill="#666">
                  {tick.label}
                </text>
              </g>
            ))}

            {/* Y-axis ticks and labels */}
            {yTicks.map((tick, index) => (
              <g key={index}>
                <line x1={padding - 5} y1={tick.y} x2={padding} y2={tick.y} stroke="#666" strokeWidth="1" />
                <text x={padding - 10} y={tick.y + 4} textAnchor="end" fontSize="12" fill="#666">
                  {tick.label}
                </text>
              </g>
            ))}

            {/* Curve lines */}
            {curvesToDisplay.map((curve) => {
              const path = createPath(curve.points)

              return (
                <g key={curve.name}>
                  {/* Line */}
                  <path
                    d={path}
                    fill="none"
                    stroke={curve.color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Points */}
                  {curve.points.map((point, index) => (
                    <circle
                      key={index}
                      cx={scaleX(point.x)}
                      cy={scaleY(point.y)}
                      r="5"
                      fill={curve.color}
                      stroke="white"
                      strokeWidth="2"
                      className="cursor-pointer hover:r-7"
                      onMouseEnter={() => setHoveredPoint({ campaign: curve.name, point })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  ))}
                </g>
              )
            })}
          </svg>

          {/* Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute bg-white border border-gray-300 rounded p-2 shadow-lg pointer-events-none z-10"
              style={{
                left: scaleX(hoveredPoint.point.x) + 10,
                top: scaleY(hoveredPoint.point.y) - 10,
              }}
            >
              <div className="text-sm font-medium">{hoveredPoint.campaign}</div>
              <div className="text-xs text-gray-600">Inversión: ${hoveredPoint.point.x.toLocaleString()}</div>
              <div className="text-xs text-gray-600">
                {selectedKPI}:{" "}
                {selectedKPI === "ROAS" ? `${hoveredPoint.point.y.toFixed(2)}x` : `$${hoveredPoint.point.y.toFixed(2)}`}
              </div>
            </div>
          )}
        </div>

        {/* Chart Labels */}
        <div className="text-center mt-4">
          <div className="text-sm text-gray-600">Eje X: Inversión | Eje Y: {getYAxisLabel()}</div>
        </div>

        {/* Single curve legend */}
        <div className="mt-4 flex justify-center">
          {curvesToDisplay.map((curve) => (
            <div key={curve.name} className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: curve.color }} />
              <span className="text-sm font-medium">
                {curve.name}
                {viewMode === "media" && " (Agregada)"}
              </span>
            </div>
          ))}
        </div>

        {/* Additional info for media view */}
        {viewMode === "media" && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="text-xs text-blue-700">
              <strong>Nota:</strong> Esta curva representa el rendimiento agregado de {selectedKPI} para todas las
              campañas de {selectedMedia}, combinando sus datos de inversión y {selectedKPI} para mostrar el
              comportamiento general de la media.
            </div>
          </div>
        )}

        {/* Filter information */}
        {(selectedGeos.length > 0 || selectedEventNames.length > 0) && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-700">
              <strong>Filtros aplicados:</strong>
              {selectedGeos.length > 0 && <span className="ml-2">Geografías: {selectedGeos.join(", ")}</span>}
              {selectedEventNames.length > 0 && <span className="ml-2">Eventos: {selectedEventNames.join(", ")}</span>}
            </div>
          </div>
        )}

        {/* KPI Information */}
        <div className="mt-3 p-3 bg-purple-50 rounded-lg">
          <div className="text-xs text-purple-700">
            <strong>KPI Seleccionado:</strong> {selectedKPI} -
            {selectedKPI === "CPA" && " Costo por adquisición (menor es mejor)"}
            {selectedKPI === "ROAS" && " Retorno sobre inversión publicitaria (mayor es mejor)"}
            {selectedKPI === "CPR" && " Costo por registro (menor es mejor)"}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
