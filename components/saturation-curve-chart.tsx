"use client"

import { useState } from "react"
import type { SaturationCurveData, SaturationCurvePoint } from "@/lib/csv-data-service"

interface SaturationCurveChartProps {
  data: SaturationCurveData[]
  kpi: string
  title: string
  height?: number
  showProjection?: boolean
}

export function SaturationCurveChart({
  data,
  kpi,
  title,
  height = 400,
  showProjection = true,
}: SaturationCurveChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    curve: string
    point: SaturationCurvePoint
    isProjected?: boolean
  } | null>(null)
  const [showRegressionParams, setShowRegressionParams] = useState(false)

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No hay datos disponibles</div>
          <p className="text-sm">No se encontraron datos para generar la curva de saturación.</p>
        </div>
      </div>
    )
  }

  // Calculate chart dimensions and scales
  const chartWidth = 800
  const chartHeight = height
  const padding = 60

  // Get data ranges from all curves (including projections)
  const allPoints = data.flatMap((curve) => [
    ...curve.points,
    ...(showProjection && curve.projectedPoints ? curve.projectedPoints : []),
  ])

  if (allPoints.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">Sin puntos de datos</div>
          <p className="text-sm">Las curvas no contienen puntos válidos para mostrar.</p>
        </div>
      </div>
    )
  }

  const minX = Math.min(...allPoints.map((p) => p.cumulativeSpend))
  const maxX = Math.max(...allPoints.map((p) => p.cumulativeSpend))
  const minY = Math.min(...allPoints.map((p) => p.cumulativeEvents))
  const maxY = Math.max(...allPoints.map((p) => p.cumulativeEvents))

  // Add some padding to the ranges
  const xRange = maxX - minX
  const yRange = maxY - minY
  const paddedMinX = Math.max(0, minX - xRange * 0.05)
  const paddedMaxX = maxX + xRange * 0.05
  const paddedMinY = Math.max(0, minY - yRange * 0.1)
  const paddedMaxY = maxY + yRange * 0.1

  // Scale functions
  const scaleX = (x: number) => padding + ((x - paddedMinX) / (paddedMaxX - paddedMinX)) * (chartWidth - 2 * padding)
  const scaleY = (y: number) =>
    chartHeight - padding - ((y - paddedMinY) / (paddedMaxY - paddedMinY)) * (chartHeight - 2 * padding)

  // Create path for curve using regression formula
  const createRegressionPath = (curve: SaturationCurveData) => {
    if (!curve.regressionParams) return ""

    const points: string[] = []
    const steps = 100
    const stepSize = (paddedMaxX - paddedMinX) / steps

    for (let i = 0; i <= steps; i++) {
      const spend = paddedMinX + i * stepSize
      if (spend <= 0) continue

      const lnSpend = Math.log(spend)
      // Fórmula: events = constant + ln_coefficient * ln(spend)
      // Equivalente a: registrations = -25234 + 1904 ln x
      const events = curve.regressionParams.constant + curve.regressionParams.ln * lnSpend

      if (events > paddedMinY && events < paddedMaxY) {
        const x = scaleX(spend)
        const y = scaleY(events)
        points.push(`${i === 0 ? "M" : "L"} ${x} ${y}`)
      }
    }

    return points.join(" ")
  }

  // Generate X-axis ticks
  const xTicks = []
  const tickCount = 6
  for (let i = 0; i <= tickCount; i++) {
    const value = paddedMinX + (paddedMaxX - paddedMinX) * (i / tickCount)
    xTicks.push({
      value,
      x: scaleX(value),
      label: value >= 1000000 ? `$${(value / 1000000).toFixed(1)}M` : `$${(value / 1000).toFixed(0)}K`,
    })
  }

  // Generate Y-axis ticks
  const yTicks = []
  for (let i = 0; i <= 5; i++) {
    const value = paddedMinY + (paddedMaxY - paddedMinY) * (i / 5)
    yTicks.push({
      value,
      y: scaleY(value),
      label: value >= 1000 ? `${(value / 1000).toFixed(1)}K` : `${Math.round(value)}`,
    })
  }

  // Get event label based on KPI
  const getEventLabel = () => {
    switch (kpi) {
      case "CPA":
        return "conversions"
      case "CPC":
        return "clicks"
      case "CPM":
        return "impressions"
      case "CPR":
        return "registrations"
      case "ROAS":
        return "conversions"
      default:
        return "events"
    }
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-gray-600">
            Curva de saturación mostrando la relación entre inversión y {getEventLabel()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowRegressionParams(!showRegressionParams)}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-700"
          >
            {showRegressionParams ? "Ocultar parámetros" : "Ver parámetros"}
          </button>
        </div>
      </div>

      {/* Regression Parameters and Target Analysis */}
      {showRegressionParams && (
        <div className="mb-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Parameters Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-200 px-4 py-2 text-left">CURVE Parameters</th>
                  <th className="border border-gray-200 px-4 py-2 text-right">Ln</th>
                  <th className="border border-gray-200 px-4 py-2 text-right">Constant</th>
                </tr>
              </thead>
              <tbody>
                {data.map((curve) => (
                  <tr key={curve.name}>
                    <td className="border border-gray-200 px-4 py-2">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: curve.color }}></div>
                        {curve.name}
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-right font-mono">
                      {curve.regressionParams ? curve.regressionParams.ln.toFixed(2) : "N/A"}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-right font-mono">
                      {curve.regressionParams ? curve.regressionParams.constant.toFixed(2) : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Target Analysis */}
          {data.some((curve) => curve.targetAnalysis) && (
            <div className="space-y-2">
              {data
                .filter((curve) => curve.targetAnalysis)
                .map((curve) => (
                  <div key={`target-${curve.name}`} className="border border-gray-200 rounded">
                    <div className="bg-black text-white px-3 py-1 text-sm font-medium">TARGET CPA</div>
                    <div className="bg-yellow-400 text-black px-3 py-1 text-lg font-bold">
                      ${curve.targetAnalysis?.targetCPA?.toLocaleString()}
                    </div>
                    <div className="bg-black text-white px-3 py-1 text-sm font-medium">SPEND</div>
                    <div className="bg-yellow-400 text-black px-3 py-1 text-lg font-bold">
                      ${curve.targetAnalysis?.recommendedSpend?.toLocaleString()}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

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

          {/* Regression curves and data points */}
          {data.map((curve) => {
            const regressionPath = createRegressionPath(curve)

            return (
              <g key={curve.name}>
                {/* Regression curve line */}
                {regressionPath && (
                  <path
                    d={regressionPath}
                    fill="none"
                    stroke={curve.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.8"
                  />
                )}

                {/* Actual data points */}
                {curve.points.map((point, index) => (
                  <circle
                    key={`actual-${index}`}
                    cx={scaleX(point.cumulativeSpend)}
                    cy={scaleY(point.cumulativeEvents)}
                    r="4"
                    fill={curve.color}
                    stroke="white"
                    strokeWidth="1"
                    className="cursor-pointer hover:r-6"
                    onMouseEnter={() => setHoveredPoint({ curve: curve.name, point })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}

                {/* Projected data points */}
                {showProjection &&
                  curve.projectedPoints &&
                  curve.projectedPoints.map((point, index) => (
                    <circle
                      key={`projected-${index}`}
                      cx={scaleX(point.cumulativeSpend)}
                      cy={scaleY(point.cumulativeEvents)}
                      r="3"
                      fill="white"
                      stroke={curve.color}
                      strokeWidth="2"
                      strokeDasharray="2,2"
                      className="cursor-pointer hover:r-5"
                      onMouseEnter={() => setHoveredPoint({ curve: curve.name, point, isProjected: true })}
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
              left: scaleX(hoveredPoint.point.cumulativeSpend) + 10,
              top: scaleY(hoveredPoint.point.cumulativeEvents) - 10,
            }}
          >
            <div className="text-sm font-medium">
              {hoveredPoint.curve} {hoveredPoint.isProjected && "(Proyectado)"}
            </div>
            <div className="text-xs text-gray-600">Spend: ${hoveredPoint.point.cumulativeSpend.toLocaleString()}</div>
            <div className="text-xs text-gray-600">
              {getEventLabel()}: {hoveredPoint.point.cumulativeEvents.toLocaleString()}
            </div>
            {hoveredPoint.point.ln_spend !== undefined && (
              <div className="text-xs text-gray-600">ln(spend): {hoveredPoint.point.ln_spend.toFixed(2)}</div>
            )}
          </div>
        )}
      </div>

      {/* Chart Labels */}
      <div className="text-center mt-4">
        <div className="text-sm text-gray-600">Eje X: spend | Eje Y: {getEventLabel()}</div>
      </div>

      {/* Legend with regression formula */}
      <div className="mt-4 space-y-2">
        {data.map((curve) => (
          <div key={curve.name} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: curve.color }} />
              <span className="text-sm font-medium">{curve.name}</span>
              <span className="text-xs text-gray-500">
                (${curve.totalSpend.toLocaleString()} | {curve.totalEvents.toLocaleString()} {getEventLabel()})
              </span>
            </div>
            {curve.regressionParams && (
              <div className="text-xs font-mono text-gray-600">
                {getEventLabel()} = {curve.regressionParams.constant.toFixed(0)} +{" "}
                {curve.regressionParams.ln.toFixed(0)} ln x R² = {curve.regressionParams.rSquared.toFixed(3)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Projection Legend */}
      {showProjection && (
        <div className="mt-2 flex justify-center items-center text-xs text-gray-500">
          <div className="flex items-center mr-4">
            <div className="w-4 h-4 rounded-full bg-purple-600 mr-1"></div>
            <span>Datos reales</span>
          </div>
          <div className="flex items-center mr-4">
            <div className="w-8 h-0.5 bg-purple-600 mr-1"></div>
            <span>Curva de regresión</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-white border-2 border-purple-600 mr-1"></div>
            <span>Proyección</span>
          </div>
        </div>
      )}
    </div>
  )
}
