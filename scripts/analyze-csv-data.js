// Fetch and analyze the CSV data
const csvUrl =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%5BTEMPLATE%5D%20ShellBox_%20Saturation%20Curves%20%26%20Elasticity%20-%20final_events-0meIvhcIJPmYiQab2JqQi7DdGV8qSr.csv"

async function fetchAndAnalyzeData() {
  try {
    console.log("Fetching CSV data...")
    const response = await fetch(csvUrl)
    const csvText = await response.text()

    // Parse CSV manually (simple approach)
    const lines = csvText.split("\n")
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

    console.log("Headers:", headers)

    const data = []
    for (let i = 1; i < lines.length && i < 100; i++) {
      // Analyze first 100 rows
      if (lines[i].trim()) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
        const row = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ""
        })
        data.push(row)
      }
    }

    console.log(`Parsed ${data.length} rows`)
    console.log("Sample row:", data[0])

    // Analyze unique values for key fields
    const uniqueCountries = [...new Set(data.map((row) => row.campaign_country))].filter(Boolean)
    const uniqueMediaSources = [...new Set(data.map((row) => row.media_source))].filter(Boolean)
    const uniqueCampaigns = [...new Set(data.map((row) => row.campaign_name))].filter(Boolean)
    const uniqueEventNames = [...new Set(data.map((row) => row.event_name))].filter(Boolean)

    console.log("Unique Countries:", uniqueCountries)
    console.log("Unique Media Sources:", uniqueMediaSources)
    console.log("Unique Campaigns (first 10):", uniqueCampaigns.slice(0, 10))
    console.log("Unique Event Names:", uniqueEventNames)

    // Analyze spend and events data
    const spendData = data.filter((row) => Number.parseFloat(row.original_spend) > 0)
    const installsData = data.filter((row) => Number.parseInt(row.installs) > 0)
    const registrationsData = data.filter((row) => Number.parseInt(row.Registrations) > 0)

    console.log(`Rows with spend > 0: ${spendData.length}`)
    console.log(`Rows with installs > 0: ${installsData.length}`)
    console.log(`Rows with registrations > 0: ${registrationsData.length}`)

    // Sample aggregated data by campaign and week
    const aggregatedData = {}
    data.forEach((row) => {
      const key = `${row.campaign_name}_${row.summary_week}`
      if (!aggregatedData[key]) {
        aggregatedData[key] = {
          campaign_name: row.campaign_name,
          campaign_country: row.campaign_country,
          media_source: row.media_source,
          summary_week: row.summary_week,
          total_spend: 0,
          total_installs: 0,
          total_registrations: 0,
        }
      }

      aggregatedData[key].total_spend += Number.parseFloat(row.original_spend) || 0
      aggregatedData[key].total_installs += Number.parseInt(row.installs) || 0
      aggregatedData[key].total_registrations += Number.parseInt(row.Registrations) || 0
    })

    const aggregatedArray = Object.values(aggregatedData).slice(0, 20)
    console.log("Sample aggregated data:", aggregatedArray)

    return {
      totalRows: data.length,
      uniqueCountries,
      uniqueMediaSources,
      uniqueCampaigns: uniqueCampaigns.slice(0, 20), // Limit for display
      uniqueEventNames,
      sampleData: data.slice(0, 5),
      aggregatedSample: aggregatedArray,
    }
  } catch (error) {
    console.error("Error fetching/analyzing data:", error)
    return null
  }
}

// Execute the analysis
fetchAndAnalyzeData().then((result) => {
  if (result) {
    console.log("Analysis complete!")
    console.log("Summary:", {
      totalRows: result.totalRows,
      countriesCount: result.uniqueCountries.length,
      mediaSourcesCount: result.uniqueMediaSources.length,
      campaignsCount: result.uniqueCampaigns.length,
      eventNamesCount: result.uniqueEventNames.length,
    })
  }
})
