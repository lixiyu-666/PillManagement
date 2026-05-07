/**
 * Android 原生接口适配
 * 用于 WebView 环境下调用 Android 原生功能
 */

const AndroidBridge = {
  // 检测是否在 Android WebView 环境中
  isAndroid: () => {
    return typeof window !== 'undefined' && 
           typeof window.MedicationAndroid !== 'undefined'
  },

  /**
   * 显示原生通知
   * @param {string} title - 通知标题
   * @param {string} message - 通知内容
   * @param {number} notificationId - 通知 ID（用于区分和取消）
   */
  showNotification: (title, message, notificationId) => {
    if (AndroidBridge.isAndroid()) {
      window.MedicationAndroid.showNotification(title, message, notificationId)
    } else {
      // Web 环境使用浏览器通知
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: message, icon: '/favicon.svg' })
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body: message, icon: '/favicon.svg' })
          }
        })
      }
    }
  },

  /**
   * 设置服药提醒闹钟
   * @param {number} medicationId - 药品 ID
   * @param {Date|number} time - 提醒时间
   */
  scheduleAlarm: (medicationId, time) => {
    if (AndroidBridge.isAndroid()) {
      const timeInMillis = time instanceof Date ? time.getTime() : time
      window.MedicationAndroid.scheduleAlarm(medicationId, timeInMillis)
    } else {
      // Web 环境使用 setTimeout 模拟（仅在前端运行时有效）
      const delay = time instanceof Date ? time.getTime() - Date.now() : time - Date.now()
      if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          AndroidBridge.showNotification('服药提醒', '该服药了', medicationId)
        }, delay)
      }
    }
  },

  /**
   * 取消服药提醒闹钟
   * @param {number} medicationId - 药品 ID
   */
  cancelAlarm: (medicationId) => {
    if (AndroidBridge.isAndroid()) {
      window.MedicationAndroid.cancelAlarm(medicationId)
    }
  },

  /**
   * 解析服药时间并设置提醒
   * @param {Object} medication - 药品对象
   * @param {string} scheduleTime - 服药时间 (HH:mm 格式)
   */
  scheduleMedicationReminder: (medication, scheduleTime) => {
    const [hours, minutes] = scheduleTime.split(':').map(Number)
    const now = new Date()
    const reminderTime = new Date()
    reminderTime.setHours(hours, minutes, 0, 0)
    
    // 如果时间已过，设置到明天
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1)
    }
    
    AndroidBridge.scheduleAlarm(medication.id, reminderTime.getTime())
  }
}

export default AndroidBridge
