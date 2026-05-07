package com.medication.tracker

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat

class MedicationReminderReceiver : BroadcastReceiver() {
    
    override fun onReceive(context: Context, intent: Intent) {
        val medicationId = intent.getIntExtra("medication_id", 0)
        showNotification(context, medicationId)
    }
    
    private fun showNotification(context: Context, medicationId: Int) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        val notification = NotificationCompat.Builder(context, "medication_reminder_channel")
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("服药提醒")
            .setContentText("该服药了，请打开应用确认")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setVibrate(longArrayOf(0, 500, 200, 500))
            .build()
        
        notificationManager.notify(medicationId, notification)
    }
}
