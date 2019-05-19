const express = require('express')
const consola = require('consola')
const { Nuxt, Builder } = require('nuxt')
const app = express()

// Import and Set Nuxt.js options
const config = require('../nuxt.config.js')
config.dev = !(process.env.NODE_ENV === 'production')
const apiRouter = require('./api')

async function start() {
  // Init Nuxt.js
  const nuxt = new Nuxt(config)

  const { host, port } = nuxt.options.server

  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  } else {
    await nuxt.ready()
  }

  // Give nuxt middleware to express
  app.use('/api', apiRouter)
  app.use(express.static('data'))
  app.use(nuxt.render)

  // Listen the server
  const server = app.listen(port, host)
  socketStart(server)
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  })
}

function socketStart(server) {
  const io = require('socket.io').listen(server)
  io.on('connection', function(socket) {
    console.log('connected')
    socket.on('send-token', function(msg) {
      if (msg !== '') {
        console.log(msg)
      } else {
        console.log('トークンがありません')
      }
    })
    socket.on('message', function(msg) {
      if (msg !== '') {
        socket.emit('server-message-own', {
          msg: msg,
          date: new Date()
        })
        socket.broadcast.emit('server-message', {
          msg: msg,
          date: new Date()
        })
      }
    })
    socket.on('alert-input', function(msg) {
      socket.broadcast.emit('server-alertInput', msg)
    })
    socket.on('remove-alert-input', function(msg) {
      socket.broadcast.emit('server-remove-alertInput', msg)
    })
    socket.on('file-upload', function(msg) {
      console.log(msg)
      socket.emit('server-file-upload-own', {
        msg: msg,
        date: new Date()
      })
      socket.broadcast.emit('server-file-upload', {
        msg: msg,
        date: new Date()
      })
    })
  })
}

start()
