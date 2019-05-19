<template>
  <section class="container">
    <span class="help-block">Let's Chat!!!</span>
    <!-- Alert Message -->
    <div class="alert-wrapper">
      <div
        v-if="onInput"
        id="input-alert"
        class="alert alert-warning"
        role="alert"
      >
        {{ alertMessage }}
      </div>
    </div>
    <!-- Message Form -->
    <div class="input-group mb-3">
      <input
        id="input-msg"
        v-model="message"
        class="form-control"
        placeholder="input message"
        aria-label="message input box"
        aria-describedby="button-addon2"
        @focus="alertInput"
        @blur="removeAlert"
      />
      <div class="input-group-append">
        <button
          class="btn btn-outline-secondary"
          type="button"
          @click="connect"
        >
          Send
        </button>
      </div>
    </div>
    <!-- File Upload Form -->
    <div class="input-group">
      <div class="custom-file">
        <input
          id="inputGroupFile01"
          type="file"
          class="custom-file-input"
          aria-describedby="inputGroupFileAddon01"
          @focus="alertInput"
          @blur="removeAlert"
          @change="changeFileTitle"
        />
        <label
          id="inputGroupFileAddon04Label"
          class="custom-file-label"
          for="inputGroupFile01"
          >Choose File</label
        >
      </div>
      <div class="input-group-append">
        <button
          id="inputGroupFileAddon04"
          class="btn btn-outline-secondary"
          type="button"
          @click="uploadFile"
        >
          Upload
        </button>
      </div>
    </div>
    <!-- Message List Box -->
    <div id="chat-box">
      <div v-for="(msg, i) in msgs" :key="i">
        <div :class="getMsgBoxClass(msg.dir)">
          <span v-if="msg.dir === 'right'" class="msg-time">{{
            parseDate(msg.date)
          }}</span>
          <div :class="getMsgClass(msg.dir)">
            <p v-if="msg.msg">{{ msg.msg }}</p>
            <img v-else class="msg-img" :src="msg.src" />
          </div>
          <span v-if="msg.dir === 'left'" class="msg-time">{{
            parseDate(msg.date)
          }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import io from 'socket.io-client'
import firebase from '~/plugins/firebase'
export default {
  components: {},
  data: function() {
    return {
      message: '',
      file: '',
      msgs: [],
      socketio: '',
      alertMessage: '',
      onInput: false
    }
  },
  mounted: function() {
    this.startSocketIo()
    this.initFirebase()
    this.listenMessage()
  },
  methods: {
    startSocketIo() {
      this.socketio = io()
      this.socketio.on('server-message-own', msg => {
        console.log(msg.date)
        this.msgs.unshift({ msg: msg.msg, date: msg.date, dir: 'right' })
      })
      this.socketio.on('server-message', msg => {
        console.log(msg.date)
        this.msgs.unshift({ msg: msg.msg, date: msg.date, dir: 'left' })
      })
      this.socketio.on('server-alertInput', msg => {
        this.alertMessage = 'Someone on Typing'
        this.onInput = true
      })
      this.socketio.on('server-remove-alertInput', msg => {
        this.alertMessage = ''
        this.onInput = false
      })
      this.socketio.on('server-file-upload', msg => {
        console.log(msg)
        console.log('サーバにファイルがアップロードされました')
        const re = /(^data\/(.*))/
        msg.src = msg.msg.replace(re, '$2')
        this.msgs.unshift({
          src: `http://localhost:3000/${msg.src}`,
          date: msg.date,
          dir: 'left'
        })
      })
      this.socketio.on('server-file-upload-own', msg => {
        console.log('サーバにファイルがアップロードされました')
        console.log(msg.src)
        const re = /(^data\/(.*))/
        msg.src = msg.msg.replace(re, '$2')
        this.msgs.unshift({
          src: `http://localhost:3000/${msg.src}`,
          date: msg.date,
          dir: 'right'
        })
      })
    },
    connect() {
      this.socketio.emit('message', this.message)
      this.message = ''
    },
    alertInput() {
      this.socketio.emit('alert-input', '入力アラート')
    },
    removeAlert() {
      this.socketio.emit('remove-alert-input', '入力アラート終了')
    },
    getMsgClass(dir) {
      console.log(dir)
      if (dir === 'right') {
        return 'msg-wrapper right'
      } else {
        return 'msg-wrapper left'
      }
    },
    getMsgBoxClass(dir) {
      console.log(dir)
      if (dir === 'right') {
        return 'msg-box right'
      } else {
        return 'msg-box left'
      }
    },
    parseDate(dateStr) {
      const date = new Date(dateStr)
      let hour = date.getHours()
      hour = this.zeroPadding(hour)
      let minute = date.getMinutes()
      minute = this.zeroPadding(minute)
      return `${hour}:${minute}`
    },
    zeroPadding(num) {
      num = String(num)
      if (num.length === 1) {
        num = '0' + num
      }
      return num
    },
    async uploadFile() {
      const fileInput = document.getElementById('inputGroupFile01')
      const params = new FormData()
      if (!fileInput.files[0]) {
        return
      }
      params.append('file', fileInput.files[0])
      await this.$axios
        .$post('http://localhost:3000/api/file/post', params)
        .then(res => {
          console.log('success')
          console.log(res)
          this.socketio.emit('file-upload', res)
        })
        .catch(function(err) {
          console.log(err)
        })
    },
    changeFileTitle() {
      console.log('画像が選択されました')
      const label = document.getElementById('inputGroupFileAddon04Label')
      const fileInput = document.getElementById('inputGroupFile01')
      if (!fileInput.files[0]) {
        return
      }
      label.textContent = fileInput.files[0].name
    },
    initFirebase() {
      const messaging = firebase.messaging()
      messaging.usePublicVapidKey(process.env.FIREBASE_PUBLICKEY)
      messaging
        .requestPermission()
        .then(() => {
          messaging.getToken().then(currentToken => {
            if (currentToken) {
              console.log('トークン取得済み')
              console.log(currentToken)
              this.socketio.emit('send-token', currentToken)
              this.registNortification(currentToken)
            } else {
              console.log('トークンがありません')
            }
          })
        })
        .catch(function(err) {
          console.log('Unable to get permission to notify.', err)
        })
    },
    listenMessage() {
      const messaging = firebase.messaging()
      messaging.onMessage(function(payload) {
        console.log('Message received.')
      })
    },
    registNortification(currentToken) {
      const headers = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${process.env.FIREBASE_SERVERKEY}`
        }
      }
      const data = {
        registration_ids: [currentToken],
        notification: {
          title: '新規リクエストが届きました',
          body: 'send from admin'
        },
        data: {
          action: [
            {
              action: 'request',
              title: 'リクエストを見る'
            },
            {
              action: 'order',
              title: '新規オーダーを見る'
            }
          ]
        }
      }
      this.$axios
        .$post('https://fcm.googleapis.com/fcm/send', data, headers)
        .then(function(response) {
          console.log(response)
        })
        .catch(function(error) {
          console.error(error)
        })
    }
  }
}
</script>

<style>
.container {
  padding-top: 50px;
  text-align: center;
}
#input-alert {
  width: 200px;
  margin: 0 auto;
}
.alert-wrapper {
  height: 50px;
  margin: 5px auto;
}
#chat-box {
  width: 80%;
  min-width: 400px;
  margin: 20px auto;
}
.msg-box {
  margin-bottom: 13px;
}
.msg-box.right {
  text-align: right;
}
.msg-box.left {
  text-align: left;
}
.msg-time {
  font-size: 0.8em;
  font-weight: bold;
  color: gray;
  vertical-align: bottom;
}
.msg-wrapper {
  display: inline-block;
  width: 70%;
  min-width: 100px;
  max-width: 400px;
}
.msg-wrapper.right {
  position: relative;
  background: limegreen;
  margin: 0 30px 0 auto;
  padding: 10px;
  text-align: left;
  color: white;
  font-size: 15px;
  font-weight: bold;
  border-radius: 10px;
  -webkit-border-radius: 10px;
  -moz-border-radius: 10px;
  opacity: 0.8;
}
.msg-wrapper.right:after {
  border: solid transparent;
  content: '';
  height: 0;
  width: 0;
  pointer-events: none;
  position: absolute;
  border-color: rgba(131, 255, 13, 0);
  border-top-width: 10px;
  border-bottom-width: 10px;
  border-left-width: 10px;
  border-right-width: 10px;
  margin-top: -10px;
  border-left-color: limegreen;
  left: 100%;
  top: 50%;
}

.msg-wrapper.left {
  position: relative;
  background: springgreen;
  margin: 0 auto 0 30px;
  padding: 10px;
  text-align: left;
  color: white;
  font-size: 15px;
  font-weight: bold;
  border-radius: 10px;
  -webkit-border-radius: 10px;
  -moz-border-radius: 10px;
}
.msg-wrapper.left:after {
  border: solid transparent;
  content: '';
  height: 0;
  width: 0;
  pointer-events: none;
  position: absolute;
  border-color: rgba(33, 255, 65, 0);
  border-top-width: 10px;
  border-bottom-width: 10px;
  border-left-width: 10px;
  border-right-width: 10px;
  margin-top: -10px;
  border-right-color: springgreen;
  right: 100%;
  top: 50%;
}
.msg-img {
  max-width: 90%;
  border-radius: 7px;
}
</style>
