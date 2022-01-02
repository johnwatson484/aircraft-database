const cache = require('./cache')
const Converter = require('csvtojson').Converter
const https = require('https')

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

  converter.on('end_parsed', async function () {
    await cache.stop()
    console.log('Data refreshed parsed')
  })

  converter.on('end', async function () {
    await cache.stop()
    console.log('Data refreshed')
  })

  https.get('https://opensky-network.org/datasets/metadata/aircraftDatabase.csv', function (response) {
    response.pipe(converter)
  })
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGQUIT']) {
  process.on(signal, async () => {
    await cache.stop()
    process.exit()
  })
}

main()
