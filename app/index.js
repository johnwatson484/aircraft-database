const cache = require('./cache')
const wreck = require('@hapi/wreck')
const csv = require('csvtojson')

const main = async () => {
  console.log('Sourcing data')
  await cache.start()
  const { payload } = await wreck.get('https://opensky-network.org/datasets/metadata/aircraftDatabase.csv')
  const stream = wreck.toReadableStream(payload)
  const aircraft = await csv().fromStream(stream)

  for (const plane of aircraft) {
    if (plane.icao24) {
      await cache.update('data', plane.icao24, plane)
    }
  }

  await cache.stop()
  console.log('Data refreshed')
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGQUIT']) {
  process.on(signal, async () => {
    await cache.stop()
    process.exit()
  })
}

main()
