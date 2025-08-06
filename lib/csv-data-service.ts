// Optimized CSV Data Service with intelligent ingestion and caching
export interface CampaignData {
  summary_year: string
  summary_week: string
  campaign_country: string
  media_source: string
  campaign_name: string
  original_currency: string
  original_spend: number
  installs: number
  registrations: number
  event_name: string
  conversions?: number
  revenue?: number
  clicks?: number
  impressions?: number
}

export interface ProcessedCampaignData {
  week: string
  spend: number
  events: number
  revenue: number
  geo: string
  media_source: string
  campaign: string
  event_name: string
}

export interface SaturationCurvePoint {
  spend: number
  events: number
  cumulativeSpend: number
  cumulativeEvents: number
  ln_spend?: number
}

export interface SaturationCurveData {
  name: string
  color: string
  points: SaturationCurvePoint[]
  totalSpend: number
  totalEvents: number
  avgKPI: string
  regressionParams?: {
    ln: number
    constant: number
    rSquared: number
  }
  projectedPoints?: SaturationCurvePoint[]
  targetAnalysis?: {
    targetCPA?: number
    recommendedSpend?: number
    projectedEvents?: number
  }
  isDownsampled?: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  missingColumns: string[]
  dataQuality: {
    totalRows: number
    validRows: number
    emptySpendRows: number
    emptyEventRows: number
  }
}

// Pre-aggregated data structure for faster filtering
interface PreAggregatedData {
  key: string // campaign_week_geo
  campaign_name: string
  campaign_country: string
  media_source: string
  summary_week: string
  summary_year: string
  total_spend: number
  total_conversions: number
  total_revenue: number
  total_clicks: number
  total_impressions: number
  total_installs: number
  total_registrations: number
  event_types: Set<string>
}

const CSV_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%5BTEMPLATE%5D%20ShellBox_%20Saturation%20Curves%20%26%20Elasticity%20-%20final_events-0meIvhcIJPmYiQab2JqQi7DdGV8qSr.csv"

// Required columns for curve generation
const REQUIRED_COLUMNS = [
  "campaign_name",
  "original_spend",
  "summary_week",
  "summary_year",
  "media_source",
  "campaign_country",
]

const OPTIONAL_EVENT_COLUMNS = [
  "conversions",
  "Conversions",
  "revenue",
  "Revenue",
  "clicks",
  "Clicks",
  "impressions",
  "Impressions",
  "installs",
  "registrations",
  "Registrations",
]

const MAX_ROWS_FOR_FULL_PROCESSING = 10000
const DOWNSAMPLING_FACTOR = 0.3 // Keep 30% of points when downsampling

class CSVDataService {
  private cachedRawData: CampaignData[] | null = null
  private preAggregatedData: PreAggregatedData[] | null = null
  private processedCache: Map<string, any> = new Map()
  private validationResult: ValidationResult | null = null
  private lastFetchTime = 0
  private readonly CACHE_DURATION = 10 * 60 * 1000 // 10 minutes for better performance

  /**
   * Validates CSV headers and data quality before processing
   */
  private validateCSVData(headers: string[], sampleRows: string[][]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const missingColumns: string[] = []

    // Check required columns
    const headerMap = new Map(headers.map((h, i) => [h.toLowerCase().trim(), i]))

    for (const requiredCol of REQUIRED_COLUMNS) {
      const variations = [requiredCol, requiredCol.toLowerCase(), requiredCol.replace("_", " ")]
      const found = variations.some((variation) => headers.some((h) => h.toLowerCase().trim() === variation))

      if (!found) {
        missingColumns.push(requiredCol)
        errors.push(`Columna obligatoria faltante: '${requiredCol}'`)
      }
    }

    // Check for at least one event column
    const hasEventColumn = OPTIONAL_EVENT_COLUMNS.some((eventCol) =>
      headers.some((h) => h.toLowerCase().trim() === eventCol.toLowerCase()),
    )

    if (!hasEventColumn) {
      warnings.push(
        "No se encontraron columnas de eventos (conversions, clicks, etc.). Las curvas pueden estar limitadas.",
      )
    }

    // Analyze sample data quality
    let validRows = 0
    let emptySpendRows = 0
    let emptyEventRows = 0

    const spendColIndex = headers.findIndex(
      (h) => h.toLowerCase().includes("spend") || h.toLowerCase().includes("cost"),
    )

    sampleRows.forEach((row) => {
      if (row.length >= headers.length * 0.8) {
        // At least 80% of columns filled
        validRows++
      }

      if (spendColIndex >= 0) {
        const spendValue = Number.parseFloat(row[spendColIndex] || "0")
        if (spendValue <= 0) emptySpendRows++
      }

      // Check for event data
      const hasEvents = OPTIONAL_EVENT_COLUMNS.some((eventCol) => {
        const colIndex = headers.findIndex((h) => h.toLowerCase().trim() === eventCol.toLowerCase())
        return colIndex >= 0 && Number.parseFloat(row[colIndex] || "0") > 0
      })

      if (!hasEvents) emptyEventRows++
    })

    const dataQuality = {
      totalRows: sampleRows.length,
      validRows,
      emptySpendRows,
      emptyEventRows,
    }

    // Add quality warnings
    if (emptySpendRows > sampleRows.length * 0.5) {
      warnings.push(`${Math.round((emptySpendRows / sampleRows.length) * 100)}% de las filas tienen spend = 0`)
    }

    if (emptyEventRows > sampleRows.length * 0.7) {
      warnings.push(`${Math.round((emptyEventRows / sampleRows.length) * 100)}% de las filas no tienen eventos`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingColumns,
      dataQuality,
    }
  }

  /**
   * Efficient CSV parsing with early validation
   */
  async fetchRawData(): Promise<CampaignData[]> {
    // Return cached data if still valid
    if (this.cachedRawData && Date.now() - this.lastFetchTime < this.CACHE_DURATION) {
      return this.cachedRawData
    }

    try {
      console.log("🔄 Iniciando descarga de datos CSV...")
      const startTime = Date.now()

      const response = await fetch(CSV_URL)
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: No se pudo descargar el archivo CSV`)
      }

      const csvText = await response.text()
      console.log(`📥 CSV descargado en ${Date.now() - startTime}ms`)

      // Parse headers first for early validation
      const lines = csvText.split("\n").filter((line) => line.trim())
      if (lines.length < 2) {
        throw new Error("El archivo CSV está vacío o no tiene datos suficientes")
      }

      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
      console.log("📋 Headers detectados:", headers.slice(0, 10), "...")

      // Validate with sample data (first 100 rows)
      const sampleLines = lines.slice(1, Math.min(101, lines.length))
      const sampleRows = sampleLines.map((line) => line.split(",").map((v) => v.trim().replace(/"/g, "")))

      this.validationResult = this.validateCSVData(headers, sampleRows)

      if (!this.validationResult.isValid) {
        const errorMsg = `❌ Validación fallida:\n${this.validationResult.errors.join("\n")}`
        console.error(errorMsg)
        throw new Error(errorMsg)
      }

      if (this.validationResult.warnings.length > 0) {
        console.warn("⚠️ Advertencias de calidad de datos:", this.validationResult.warnings)
      }

      console.log("✅ Validación exitosa, procesando datos...")

      // Create header mapping for flexible column matching
      const headerMap = new Map<string, number>()
      headers.forEach((header, index) => {
        const cleanHeader = header.toLowerCase().trim()
        headerMap.set(cleanHeader, index)
        // Add common variations
        headerMap.set(cleanHeader.replace("_", ""), index)
        headerMap.set(cleanHeader.replace(" ", "_"), index)
      })

      const data: CampaignData[] = []
      const totalLines = lines.length - 1
      let processedLines = 0
      let validLines = 0

      // Process in optimized chunks
      const chunkSize = 2000
      for (let i = 1; i < lines.length; i += chunkSize) {
        const chunk = lines.slice(i, i + chunkSize)

        for (const line of chunk) {
          processedLines++

          if (!line.trim()) continue

          try {
            const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))

            // Skip rows with insufficient data
            if (values.length < headers.length * 0.5) continue

            const getColumnValue = (variations: string[]): string => {
              for (const variation of variations) {
                const index = headerMap.get(variation.toLowerCase())
                if (index !== undefined && values[index]) {
                  return values[index]
                }
              }
              return ""
            }

            const getNumericValue = (variations: string[]): number => {
              const value = getColumnValue(variations)
              const parsed = Number.parseFloat(value)
              return isNaN(parsed) ? 0 : parsed
            }

            const getIntValue = (variations: string[]): number => {
              const value = getColumnValue(variations)
              const parsed = Number.parseInt(value)
              return isNaN(parsed) ? 0 : parsed
            }

            // Extract data with flexible column matching
            const rowData: CampaignData = {
              summary_year: getColumnValue(["summary_year", "year"]),
              summary_week: getColumnValue(["summary_week", "week"]),
              campaign_country: getColumnValue(["campaign_country", "country", "geo"]),
              media_source: getColumnValue(["media_source", "source", "channel"]),
              campaign_name: getColumnValue(["campaign_name", "campaign"]),
              original_currency: getColumnValue(["original_currency", "currency"]),
              original_spend: getNumericValue(["original_spend", "spend", "cost"]),
              installs: getIntValue(["installs", "install"]),
              registrations: getIntValue(["registrations", "registration", "Registrations"]),
              event_name: getColumnValue(["event_name", "event"]),
              conversions: getIntValue(["conversions", "Conversions", "conversion"]),
              revenue: getNumericValue(["revenue", "Revenue"]),
              clicks: getIntValue(["clicks", "Clicks", "click"]),
              impressions: getIntValue(["impressions", "Impressions", "impression"]),
            }

            // Basic data quality check
            if (
              rowData.campaign_name &&
              (rowData.original_spend > 0 || rowData.conversions > 0 || rowData.clicks > 0 || rowData.impressions > 0)
            ) {
              data.push(rowData)
              validLines++
            }
          } catch (error) {
            console.warn(`⚠️ Error procesando línea ${i + processedLines}: ${error}`)
          }
        }

        // Progress logging
        if (i % (chunkSize * 5) === 0) {
          const progress = Math.round((processedLines / totalLines) * 100)
          console.log(`📊 Progreso: ${progress}% (${validLines} filas válidas)`)

          // Allow other operations to run
          await new Promise((resolve) => setTimeout(resolve, 0))
        }
      }

      console.log(
        `✅ Procesamiento completado: ${validLines}/${totalLines} filas válidas en ${Date.now() - startTime}ms`,
      )

      if (validLines === 0) {
        throw new Error("No se encontraron filas válidas en el CSV. Verifica el formato de los datos.")
      }

      // Pre-aggregate data for faster filtering
      await this.preAggregateData(data)

      this.cachedRawData = data
      this.lastFetchTime = Date.now()
      return data
    } catch (error) {
      console.error("❌ Error en fetchRawData:", error)

      // Return user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes("fetch")) {
          throw new Error("No se pudo conectar al servidor. Verifica tu conexión a internet.")
        }
        if (error.message.includes("CSV")) {
          throw new Error(`Error en el archivo CSV: ${error.message}`)
        }
        throw error
      }

      throw new Error("Error desconocido al procesar los datos. Intenta nuevamente.")
    }
  }

  /**
   * Pre-aggregates data by campaign and week for faster filtering
   */
  private async preAggregateData(rawData: CampaignData[]): Promise<void> {
    console.log("🔄 Pre-agregando datos para optimización...")
    const startTime = Date.now()

    const aggregationMap = new Map<string, PreAggregatedData>()

    rawData.forEach((row) => {
      const key = `${row.campaign_name}_${row.summary_week}_${row.campaign_country}`

      if (!aggregationMap.has(key)) {
        aggregationMap.set(key, {
          key,
          campaign_name: row.campaign_name,
          campaign_country: row.campaign_country,
          media_source: row.media_source,
          summary_week: row.summary_week,
          summary_year: row.summary_year,
          total_spend: 0,
          total_conversions: 0,
          total_revenue: 0,
          total_clicks: 0,
          total_impressions: 0,
          total_installs: 0,
          total_registrations: 0,
          event_types: new Set(),
        })
      }

      const aggregated = aggregationMap.get(key)!
      aggregated.total_spend += row.original_spend
      aggregated.total_conversions += row.conversions || 0
      aggregated.total_revenue += row.revenue || 0
      aggregated.total_clicks += row.clicks || 0
      aggregated.total_impressions += row.impressions || 0
      aggregated.total_installs += row.installs
      aggregated.total_registrations += row.registrations

      // Track available event types
      if (row.conversions && row.conversions > 0) aggregated.event_types.add("conversions")
      if (row.revenue && row.revenue > 0) aggregated.event_types.add("revenue")
      if (row.clicks && row.clicks > 0) aggregated.event_types.add("clicks")
      if (row.impressions && row.impressions > 0) aggregated.event_types.add("impressions")
      if (row.installs > 0) aggregated.event_types.add("installs")
      if (row.registrations > 0) aggregated.event_types.add("registrations")
    })

    this.preAggregatedData = Array.from(aggregationMap.values())
    console.log(
      `✅ Pre-agregación completada: ${this.preAggregatedData.length} registros en ${Date.now() - startTime}ms`,
    )
  }

  /**
   * Get validation result for the current dataset
   */
  getValidationResult(): ValidationResult | null {
    return this.validationResult
  }

  /**
   * Optimized data processing using pre-aggregated data
   */
  async getProcessedCampaignData(
    filters: {
      selectedMedia?: string
      selectedCampaign?: string
      selectedGeos?: string[]
      selectedEventNames?: string[]
    } = {},
  ): Promise<ProcessedCampaignData[]> {
    const cacheKey = `processed_${JSON.stringify(filters)}`
    if (this.processedCache.has(cacheKey)) {
      console.log("📋 Usando datos procesados desde caché")
      return this.processedCache.get(cacheKey)
    }

    // Ensure we have pre-aggregated data
    if (!this.preAggregatedData) {
      await this.fetchRawData()
    }

    if (!this.preAggregatedData) {
      throw new Error("No hay datos pre-agregados disponibles")
    }

    console.log("🔄 Procesando datos con filtros:", filters)
    const startTime = Date.now()

    // Apply filters efficiently on pre-aggregated data
    const filteredData = this.preAggregatedData.filter((row) => {
      // Media filter
      if (filters.selectedMedia && filters.selectedMedia !== "All Media") {
        if (row.media_source.toLowerCase() !== filters.selectedMedia.toLowerCase()) {
          return false
        }
      }

      // Campaign filter
      if (filters.selectedCampaign && filters.selectedCampaign !== "All Campaigns") {
        if (row.campaign_name !== filters.selectedCampaign) {
          return false
        }
      }

      // Geo filter
      if (filters.selectedGeos && filters.selectedGeos.length > 0) {
        if (!filters.selectedGeos.includes(row.campaign_country)) {
          return false
        }
      }

      // Event filter - check if row has data for selected events
      if (filters.selectedEventNames && filters.selectedEventNames.length > 0) {
        const hasSelectedEvents = filters.selectedEventNames.some((eventName) =>
          row.event_types.has(eventName.toLowerCase()),
        )
        if (!hasSelectedEvents) {
          return false
        }
      }

      return true
    })

    // Convert to ProcessedCampaignData format
    const result: ProcessedCampaignData[] = filteredData.map((row) => {
      let events = 0
      let eventName = "mixed"

      // Calculate events based on selection
      if (!filters.selectedEventNames || filters.selectedEventNames.length === 0) {
        events = row.total_conversions
        eventName = "conversions"
      } else if (filters.selectedEventNames.length === 1) {
        const selectedEvent = filters.selectedEventNames[0].toLowerCase()
        eventName = selectedEvent

        switch (selectedEvent) {
          case "conversions":
            events = row.total_conversions
            break
          case "clicks":
            events = row.total_clicks
            break
          case "impressions":
            events = row.total_impressions
            break
          case "installs":
            events = row.total_installs
            break
          case "registrations":
            events = row.total_registrations
            break
          default:
            events = row.total_conversions
        }
      } else {
        // Multiple events selected
        filters.selectedEventNames.forEach((eventName) => {
          switch (eventName.toLowerCase()) {
            case "conversions":
              events += row.total_conversions
              break
            case "clicks":
              events += row.total_clicks
              break
            case "impressions":
              events += row.total_impressions
              break
            case "installs":
              events += row.total_installs
              break
            case "registrations":
              events += row.total_registrations
              break
          }
        })
        eventName = "mixed"
      }

      return {
        week: `${row.summary_year}-W${row.summary_week.padStart(2, "0")}`,
        spend: row.total_spend,
        events,
        revenue: row.total_revenue,
        geo: row.campaign_country,
        media_source: row.media_source,
        campaign: row.campaign_name,
        event_name: eventName,
      }
    })

    const finalResult = result
      .filter((item) => item.spend > 0 || item.events > 0)
      .sort((a, b) => b.week.localeCompare(a.week))

    console.log(`✅ Datos procesados: ${finalResult.length} registros en ${Date.now() - startTime}ms`)

    // Cache result
    this.processedCache.set(cacheKey, finalResult)
    return finalResult
  }

  /**
   * Intelligent downsampling for large datasets
   */
  private downsampleCurvePoints(points: SaturationCurvePoint[]): SaturationCurvePoint[] {
    if (points.length <= 50) return points

    console.log(
      `📉 Aplicando downsampling: ${points.length} → ${Math.round(points.length * DOWNSAMPLING_FACTOR)} puntos`,
    )

    // Keep first and last points, sample the middle
    const sampledPoints: SaturationCurvePoint[] = []
    const step = Math.floor(1 / DOWNSAMPLING_FACTOR)

    sampledPoints.push(points[0]) // Always keep first point

    for (let i = step; i < points.length - step; i += step) {
      sampledPoints.push(points[i])
    }

    sampledPoints.push(points[points.length - 1]) // Always keep last point

    return sampledPoints
  }

  /**
   * Optimized curve generation with intelligent caching and downsampling
   */
  async generateSaturationCurves(config: {
    media: string[]
    campaigns: string[]
    geo: string[]
    events: string[]
    kpi: string
  }): Promise<{
    overall: SaturationCurveData
    byMedia: SaturationCurveData[]
    byCampaign: SaturationCurveData[]
  }> {
    const cacheKey = `curves_${JSON.stringify(config)}`
    if (this.processedCache.has(cacheKey)) {
      console.log("📊 Usando curvas desde caché")
      return this.processedCache.get(cacheKey)
    }

    console.log("🔄 Generando curvas de saturación...")
    const startTime = Date.now()

    // Ensure we have data
    if (!this.preAggregatedData) {
      await this.fetchRawData()
    }

    if (!this.preAggregatedData) {
      throw new Error("No hay datos disponibles para generar curvas")
    }

    // Check if we need downsampling
    const shouldDownsample = this.preAggregatedData.length > MAX_ROWS_FOR_FULL_PROCESSING
    if (shouldDownsample) {
      console.log(`📊 Dataset grande detectado (${this.preAggregatedData.length} filas), aplicando optimizaciones`)
    }

    // Convert pre-aggregated data to raw format for curve generation
    const rawDataForCurves: CampaignData[] = this.preAggregatedData
      .filter((row) => {
        if (config.media.length > 0 && !config.media.some((m) => m.toLowerCase() === row.media_source.toLowerCase())) {
          return false
        }
        if (config.campaigns.length > 0 && !config.campaigns.includes(row.campaign_name)) {
          return false
        }
        if (config.geo.length > 0 && !config.geo.includes(row.campaign_country)) {
          return false
        }
        return true
      })
      .map((row) => ({
        summary_year: row.summary_year,
        summary_week: row.summary_week,
        campaign_country: row.campaign_country,
        media_source: row.media_source,
        campaign_name: row.campaign_name,
        original_currency: "USD",
        original_spend: row.total_spend,
        installs: row.total_installs,
        registrations: row.total_registrations,
        event_name: Array.from(row.event_types).join(","),
        conversions: row.total_conversions,
        revenue: row.total_revenue,
        clicks: row.total_clicks,
        impressions: row.total_impressions,
      }))

    // Generate curves
    const overall = this.generateCurveFromData(rawDataForCurves, "Overall", config.kpi, "#8B5CF6", shouldDownsample)

    // Generate media curves
    const mediaGroups = this.groupDataBy(rawDataForCurves, "media_source")
    const mediaColors = ["#1877F2", "#EA4335", "#000000", "#E4405F", "#FF6B6B", "#4ECDC4"]
    const byMedia: SaturationCurveData[] = []

    Object.entries(mediaGroups).forEach(([media, data], index) => {
      const curve = this.generateCurveFromData(
        data,
        media,
        config.kpi,
        mediaColors[index % mediaColors.length],
        shouldDownsample,
      )
      if (curve.points.length > 0) {
        byMedia.push(curve)
      }
    })

    // Generate campaign curves (limit based on dataset size)
    const maxCampaigns = shouldDownsample ? 3 : 5
    const campaignGroups = this.groupDataBy(rawDataForCurves, "campaign_name")
    const campaignColors = ["#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#6366F1"]
    const byCampaign: SaturationCurveData[] = []

    const sortedCampaigns = Object.entries(campaignGroups)
      .map(([name, data]) => ({
        name,
        data,
        totalSpend: data.reduce((sum, row) => sum + row.original_spend, 0),
      }))
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, maxCampaigns)

    sortedCampaigns.forEach(({ name, data }, index) => {
      const curve = this.generateCurveFromData(
        data,
        name,
        config.kpi,
        campaignColors[index % campaignColors.length],
        shouldDownsample,
      )
      if (curve.points.length > 0) {
        byCampaign.push(curve)
      }
    })

    const result = { overall, byMedia, byCampaign }

    console.log(`✅ Curvas generadas en ${Date.now() - startTime}ms`)

    // Cache result
    this.processedCache.set(cacheKey, result)
    return result
  }

  private generateCurveFromData(
    data: CampaignData[],
    name: string,
    kpi: string,
    color: string,
    shouldDownsample = false,
  ): SaturationCurveData {
    if (data.length === 0) {
      return {
        name,
        color,
        points: [],
        totalSpend: 0,
        totalEvents: 0,
        avgKPI: "0.00",
        isDownsampled: false,
      }
    }

    // Optimized aggregation using Map
    const weeklyData = new Map<string, any>()

    data.forEach((row) => {
      const key = `${row.summary_year}-W${row.summary_week}`
      if (!weeklyData.has(key)) {
        weeklyData.set(key, {
          spend: 0,
          events: 0,
          revenue: 0,
          conversions: 0,
          clicks: 0,
          impressions: 0,
          registrations: 0,
        })
      }

      const weekData = weeklyData.get(key)!
      weekData.spend += row.original_spend
      weekData.revenue += row.revenue || 0
      weekData.conversions += row.conversions || 0
      weekData.clicks += row.clicks || 0
      weekData.impressions += row.impressions || 0
      weekData.registrations += row.registrations || 0
    })

    const getEventsForKPI = (weekData: any, kpi: string): number => {
      switch (kpi.toLowerCase()) {
        case "cpa":
          return weekData.conversions
        case "cpc":
          return weekData.clicks
        case "cpm":
          return weekData.impressions
        case "cpr":
          return weekData.registrations
        case "roas":
          return weekData.conversions
        default:
          return weekData.conversions
      }
    }

    // Sort and create points
    const sortedWeeks = Array.from(weeklyData.entries()).sort(([, a], [, b]) => a.spend - b.spend)

    let points: SaturationCurvePoint[] = []
    const eventsArray: number[] = []
    const lnSpendArray: number[] = []

    let cumulativeSpend = 0
    let cumulativeEvents = 0

    sortedWeeks.forEach(([week, weekData]) => {
      const weekSpend = weekData.spend
      const weekEvents = getEventsForKPI(weekData, kpi)

      cumulativeSpend += weekSpend
      cumulativeEvents += weekEvents

      if (cumulativeSpend > 0) {
        const ln_spend = this.safeLog(cumulativeSpend)

        points.push({
          spend: weekSpend,
          events: weekEvents,
          cumulativeSpend: Math.round(cumulativeSpend),
          cumulativeEvents: Math.round(cumulativeEvents),
          ln_spend,
        })

        if (cumulativeEvents > 0 && ln_spend > 0) {
          eventsArray.push(cumulativeEvents)
          lnSpendArray.push(ln_spend)
        }
      }
    })

    // Apply downsampling if needed
    const originalPointsCount = points.length
    if (shouldDownsample && points.length > 25) {
      points = this.downsampleCurvePoints(points)
    }

    const regression = this.calculateLinearRegression(eventsArray, lnSpendArray)

    const totalSpend = data.reduce((sum, row) => sum + row.original_spend, 0)
    const totalEvents = data.reduce((sum, row) => sum + getEventsForKPI(row, kpi), 0)

    // Calculate average KPI
    let avgKPI = "0.00"
    if (totalEvents > 0) {
      switch (kpi.toLowerCase()) {
        case "roas":
          const totalRevenue = data.reduce((sum, row) => sum + (row.revenue || 0), 0)
          avgKPI = (totalRevenue / totalSpend).toFixed(2)
          break
        default:
          avgKPI = (totalSpend / totalEvents).toFixed(2)
      }
    }

    // Reduced projected points for performance
    const projectedSteps = shouldDownsample ? 5 : 10
    const projectedPoints = this.generateProjectedPoints(regression, totalSpend, totalSpend * 1.5, projectedSteps)

    let targetAnalysis: any = undefined
    if (kpi.toLowerCase() === "cpa" && regression.slope !== 0) {
      const targetCPA = 3000
      const targetResult = this.calculateTargetSpend(regression, targetCPA, totalSpend)
      targetAnalysis = {
        targetCPA,
        recommendedSpend: targetResult.recommendedSpend,
        projectedEvents: targetResult.projectedEvents,
      }
    }

    return {
      name,
      color,
      points,
      totalSpend: Math.round(totalSpend),
      totalEvents: Math.round(totalEvents),
      avgKPI,
      regressionParams: {
        ln: regression.slope,
        constant: regression.intercept,
        rSquared: regression.rSquared,
      },
      projectedPoints,
      targetAnalysis,
      isDownsampled: shouldDownsample && originalPointsCount > points.length,
    }
  }

  // Helper methods (keeping existing implementations but with better error handling)
  private safeLog(value: number): number {
    if (value <= 0) return 0
    return Math.log(value)
  }

  private calculateLinearRegression(
    yValues: number[],
    xValues: number[],
  ): { slope: number; intercept: number; rSquared: number } {
    if (xValues.length !== yValues.length || xValues.length < 2) {
      return { slope: 0, intercept: 0, rSquared: 0 }
    }

    try {
      const validPairs = []
      for (let i = 0; i < xValues.length; i++) {
        const x = xValues[i]
        const y = yValues[i]
        if (x !== 0 && y !== 0 && !isNaN(x) && !isNaN(y)) {
          validPairs.push({ x, y })
        }
      }

      if (validPairs.length < 2) {
        return { slope: 0, intercept: 0, rSquared: 0 }
      }

      const n = validPairs.length
      let sumX = 0,
        sumY = 0,
        sumXY = 0,
        sumXX = 0,
        sumYY = 0

      for (const pair of validPairs) {
        sumX += pair.x
        sumY += pair.y
        sumXY += pair.x * pair.y
        sumXX += pair.x * pair.x
        sumYY += pair.y * pair.y
      }

      const denominator = n * sumXX - sumX * sumX
      if (Math.abs(denominator) < 1e-10) {
        return { slope: 0, intercept: sumY / n, rSquared: 0 }
      }

      const slope = (n * sumXY - sumX * sumY) / denominator
      const intercept = (sumY - slope * sumX) / n

      // Calculate R-squared
      const meanY = sumY / n
      let ssRes = 0,
        ssTot = 0

      for (const pair of validPairs) {
        const predicted = slope * pair.x + intercept
        ssRes += Math.pow(pair.y - predicted, 2)
        ssTot += Math.pow(pair.y - meanY, 2)
      }

      const rSquared = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot)

      return { slope, intercept, rSquared }
    } catch (error) {
      console.warn("⚠️ Error en regresión lineal:", error)
      return { slope: 0, intercept: 0, rSquared: 0 }
    }
  }

  private calculateTargetSpend(
    regressionParams: { ln: number; constant: number },
    targetCPA: number,
    totalSpend: number,
  ): { recommendedSpend: number; projectedEvents: number } {
    try {
      let bestSpend = totalSpend
      let bestDifference = Number.POSITIVE_INFINITY

      const minSpend = totalSpend * 0.5
      const maxSpend = totalSpend * 3
      const stepSize = (maxSpend - minSpend) / 50 // Reduced iterations for performance

      for (let spend = minSpend; spend <= maxSpend; spend += stepSize) {
        const lnSpend = this.safeLog(spend)
        const projectedEvents = regressionParams.constant + regressionParams.ln * lnSpend

        if (projectedEvents > 0) {
          const calculatedCPA = spend / projectedEvents
          const difference = Math.abs(calculatedCPA - targetCPA)

          if (difference < bestDifference) {
            bestDifference = difference
            bestSpend = spend
          }
        }
      }

      const lnBestSpend = this.safeLog(bestSpend)
      const projectedEvents = Math.max(0, regressionParams.constant + regressionParams.ln * lnBestSpend)

      return {
        recommendedSpend: Math.round(bestSpend),
        projectedEvents: Math.round(projectedEvents),
      }
    } catch (error) {
      console.warn("⚠️ Error calculando spend objetivo:", error)
      return {
        recommendedSpend: Math.round(totalSpend),
        projectedEvents: 0,
      }
    }
  }

  private generateProjectedPoints(
    regressionParams: { slope: number; intercept: number },
    startSpend: number,
    maxSpend: number,
    steps: number,
  ): SaturationCurvePoint[] {
    if (!regressionParams || maxSpend <= startSpend) {
      return []
    }

    const points: SaturationCurvePoint[] = []
    const stepSize = (maxSpend - startSpend) / steps

    for (let i = 1; i <= steps; i++) {
      const spend = startSpend + i * stepSize
      const ln_spend = this.safeLog(spend)
      const projectedEvents = regressionParams.intercept + regressionParams.slope * ln_spend

      if (projectedEvents > 0) {
        points.push({
          spend: 0,
          events: 0,
          cumulativeSpend: Math.round(spend),
          cumulativeEvents: Math.round(projectedEvents),
          ln_spend,
        })
      }
    }

    return points
  }

  private groupDataBy(data: CampaignData[], field: keyof CampaignData): Record<string, CampaignData[]> {
    const groups: Record<string, CampaignData[]> = {}

    data.forEach((row) => {
      const key = String(row[field])
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(row)
    })

    return groups
  }

  // Existing methods with optimizations...
  async getUniqueValues(): Promise<{
    countries: string[]
    mediaSources: string[]
    campaigns: string[]
    eventNames: string[]
  }> {
    const cacheKey = "unique_values"
    if (this.processedCache.has(cacheKey)) {
      return this.processedCache.get(cacheKey)
    }

    if (!this.preAggregatedData) {
      await this.fetchRawData()
    }

    const countries = new Set<string>()
    const mediaSources = new Set<string>()
    const campaigns = new Set<string>()

    this.preAggregatedData!.forEach((row) => {
      if (row.campaign_country) countries.add(row.campaign_country)
      if (row.media_source) mediaSources.add(row.media_source)
      if (row.campaign_name) campaigns.add(row.campaign_name)
    })

    const result = {
      countries: Array.from(countries).sort(),
      mediaSources: Array.from(mediaSources).sort(),
      campaigns: Array.from(campaigns).sort(),
      eventNames: ["conversions", "revenue", "clicks", "impressions"],
    }

    this.processedCache.set(cacheKey, result)
    return result
  }

  async getCampaignsByMedia(mediaSource?: string): Promise<string[]> {
    const cacheKey = `campaigns_by_media_${mediaSource}`
    if (this.processedCache.has(cacheKey)) {
      return this.processedCache.get(cacheKey)
    }

    if (!this.preAggregatedData) {
      await this.fetchRawData()
    }

    const campaigns = new Set<string>()
    this.preAggregatedData!.forEach((row) => {
      if (!mediaSource || mediaSource === "All Media" || row.media_source.toLowerCase() === mediaSource.toLowerCase()) {
        if (row.campaign_name) campaigns.add(row.campaign_name)
      }
    })

    const result = Array.from(campaigns).sort()
    this.processedCache.set(cacheKey, result)
    return result
  }

  async getMediaSourcesWithCounts(): Promise<Array<{ name: string; campaignCount: number }>> {
    const cacheKey = "media_sources_with_counts"
    if (this.processedCache.has(cacheKey)) {
      return this.processedCache.get(cacheKey)
    }

    if (!this.preAggregatedData) {
      await this.fetchRawData()
    }

    const mediaGroups = new Map<string, Set<string>>()
    this.preAggregatedData!.forEach((row) => {
      if (!mediaGroups.has(row.media_source)) {
        mediaGroups.set(row.media_source, new Set())
      }
      mediaGroups.get(row.media_source)!.add(row.campaign_name)
    })

    const result = Array.from(mediaGroups.entries())
      .map(([media, campaigns]) => ({
        name: media,
        campaignCount: campaigns.size,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    this.processedCache.set(cacheKey, result)
    return result
  }

  async getCountriesWithCounts(): Promise<Array<{ name: string; campaignCount: number }>> {
    const cacheKey = "countries_with_counts"
    if (this.processedCache.has(cacheKey)) {
      return this.processedCache.get(cacheKey)
    }

    if (!this.preAggregatedData) {
      await this.fetchRawData()
    }

    const countryGroups = new Map<string, Set<string>>()
    this.preAggregatedData!.forEach((row) => {
      if (row.campaign_country) {
        if (!countryGroups.has(row.campaign_country)) {
          countryGroups.set(row.campaign_country, new Set())
        }
        countryGroups.get(row.campaign_country)!.add(row.campaign_name)
      }
    })

    const result = Array.from(countryGroups.entries())
      .map(([country, campaigns]) => ({
        name: country,
        campaignCount: campaigns.size,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    this.processedCache.set(cacheKey, result)
    return result
  }

  async getCampaignDetails(): Promise<
    Array<{
      name: string
      mediaSource: string
      country: string
      totalSpend: number
      seasonal: boolean
    }>
  > {
    const cacheKey = "campaign_details"
    if (this.processedCache.has(cacheKey)) {
      return this.processedCache.get(cacheKey)
    }

    if (!this.preAggregatedData) {
      await this.fetchRawData()
    }

    const campaignGroups = new Map<string, any>()
    this.preAggregatedData!.forEach((row) => {
      const key = `${row.campaign_name}_${row.media_source}_${row.campaign_country}`
      if (!campaignGroups.has(key)) {
        campaignGroups.set(key, {
          name: row.campaign_name,
          mediaSource: row.media_source,
          country: row.campaign_country,
          totalSpend: 0,
          weeks: new Set(),
        })
      }
      const campaign = campaignGroups.get(key)!
      campaign.totalSpend += row.total_spend
      campaign.weeks.add(row.summary_week)
    })

    const result = Array.from(campaignGroups.values()).map((campaign) => ({
      name: campaign.name,
      mediaSource: campaign.mediaSource,
      country: campaign.country,
      totalSpend: campaign.totalSpend,
      seasonal: campaign.weeks.size < 10,
    }))

    this.processedCache.set(cacheKey, result)
    return result
  }

  async getMediaAggregatedData(
    filters: {
      selectedMedia?: string
      selectedGeos?: string[]
      selectedEventNames?: string[]
    } = {},
  ): Promise<ProcessedCampaignData[]> {
    const campaignData = await this.getProcessedCampaignData(filters)

    const mediaAggregated = new Map<string, ProcessedCampaignData>()

    campaignData.forEach((row) => {
      const key = `${row.media_source}_${row.week}`

      let item = mediaAggregated.get(key)
      if (!item) {
        item = {
          week: row.week,
          spend: 0,
          events: 0,
          revenue: 0,
          geo: "All",
          media_source: row.media_source,
          campaign: row.media_source,
          event_name: row.event_name,
        }
        mediaAggregated.set(key, item)
      }

      item.spend += row.spend
      item.events += row.events
      item.revenue += row.revenue
    })

    return Array.from(mediaAggregated.values())
      .filter((item) => item.spend > 0 || item.events > 0)
      .sort((a, b) => b.week.localeCompare(a.week))
  }

  /**
   * Clear all caches (useful for testing or memory management)
   */
  clearCache(): void {
    this.cachedRawData = null
    this.preAggregatedData = null
    this.processedCache.clear()
    this.validationResult = null
    this.lastFetchTime = 0
    console.log("🗑️ Cache limpiado")
  }
}

export const csvDataService = new CSVDataService()
