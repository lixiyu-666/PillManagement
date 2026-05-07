import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'vant/lib/index.css'
import './assets/styles/global.css'
import initDatabase from './db/database.js'
import { generateDailyRecords } from './db/dao/recordDao.js'

let databaseReady = false

async function initApp() {
  try {
    await initDatabase()
    databaseReady = true
    
    const today = new Date().toISOString().split('T')[0]
    generateDailyRecords(today)
    
    const app = createApp(App)
    app.use(createPinia())
    app.use(router)
    app.mount('#app')
    
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Failed to initialize database:', error)
    
    const app = createApp({
      template: `
        <div style="padding: 20px; text-align: center;">
          <h2>数据库初始化失败</h2>
          <p>请刷新页面重试</p>
          <button @click="reload">刷新</button>
        </div>
      `,
      methods: {
        reload() {
          window.location.reload()
        }
      }
    })
    app.use(createPinia())
    app.use(router)
    app.mount('#app')
  }
}

initApp()

export { databaseReady }
