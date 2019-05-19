importScripts('https://www.gstatic.com/firebasejs/4.8.1/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/4.8.1/firebase-messaging.js')

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
firebase.initializeApp({
  messagingSenderId: '1043934475514'
})

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging()

messaging.setBackgroundMessageHandler(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ')
  // Customize notification here
  // let notificationTitle = payload.nortification.title
  let notificationTitle = 'タイトル'
  let notificationOptions = {
    // body: payload.nortification.body,
    body: '本文',
    icon: '/firebase-logo.png'
  }

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  )
})

// TODO: actionの実装
self.addEventListener('push', event => {
  const json = event.data.json()
  console.log(event.data.json())
  event.waitUntil(
    self.registration.showNotification(json.notification.title, {
      body: json.notification.body,
      tag: 'request',
      icon: '/public/favicon-144.png'
    })
  )
})
