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

  converter.on('end', function () {
    console.log('Data refreshed')
    process.exit(0)
  })

  https.get('https://opensky-network.org/datasets/metadata/aircraftDatabase.csv', async function (response) {
    response.pipe(converter)
  })
}

main()
