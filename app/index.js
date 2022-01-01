const cache = require('./cache')

const main = async () => {
  await cache.start()
  await cache.stop()
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGQUIT']) {
  process.on(signal, async () => {
    await cache.stop()
    process.exit()
  })
}

main()
