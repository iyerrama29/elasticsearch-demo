module.exports = (app) => {
  app.use('/elastic', require('./elastic'))
  app.use('/contentstack', require('./contentstack-webhooks'))
}
