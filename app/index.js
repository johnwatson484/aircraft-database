import cache from './cache.js'
import csvtojson from 'csvtojson'
const { Converter } = csvtojson
import { Readable } from 'stream'

const main = async () => {
  await cache.start()
  console.log('Sourcing data')

  const converter = new Converter({ constructResult: false })

  converter.on('data', async function (data) {
    const plane = JSON.parse(data)
    if (plane.icao24) {
      await cache.update('data', plane.icao24, plane)
    }
  })

  converter.on('end', function () {
    console.log('Data refreshed')
    process.exit(0)
  })

  converter.on('error', (err) => {
    console.error('Converter error:', err)
    process.exit(1)
  })

  const response = await fetch('https://opensky-network.org/datasets/metadata/aircraftDatabase.csv')
  if (!response.ok) {
    console.error(`Unexpected status: ${response.status}`)
    process.exit(1)
  }
  Readable.fromWeb(response.body).pipe(converter)
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGQUIT']) {
  process.on(signal, async () => {
    console.log('Shutting down')
    await cache.stop()
    process.exit()
  })
}

main()
