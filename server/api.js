const express = require('express')
const multer = require('multer')
const router = express.Router()

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './data/uploaded')
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + file.originalname)
  }
})

const upload = multer({ storage: storage }).single('file')

router.post('/file/post', function(req, res) {
  upload(req, res, function(err) {
    if (err) {
      res.send(`Failed to write ${req.file.destination} with ${err}`)
    } else {
      // res.send(`uploaded ${req.file.originalname} as ${req.file.fieldname}`)
      console.log(`uploaded ${req.file.path}`)
      res.send(req.file.path)
    }
  })
})

module.exports = router
