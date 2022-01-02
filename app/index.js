const cache = require('./cache')
const fs = require('fs')
const https = require('https')
const csv = require('csvtojson')

const main = async () => {
  console.log('Sourcing data')

  const file = fs.createWriteStream('/tmp/aircraft-database.csv')
  https.get('https://opensky-network.org/datasets/metadata/aircraftDatabase.csv', async function (response) {
    response.pipe(file)

    response.on('end', async function () {
      await cache.start()
      const aircraft = await csv().fromFile('/tmp/aircraft-database.csv')

      for (const plane of aircraft) {
        if (plane.icao24) {
          await cache.update('data', plane.icao24, plane)
        }
      }

      await cache.stop()
      console.log('Data refreshed')
    })
  })
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGQUIT']) {
  process.on(signal, async () => {
    await cache.stop()
    process.exit()
  })
}

main()
