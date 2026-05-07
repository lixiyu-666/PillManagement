package com.medication.tracker

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.widget.Toast

class BootReceiver : BroadcastReceiver() {
    
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            // 开机完成后可以在这里重新设置闹钟
            // 实际应用中需要从本地存储读取服药计划并重新设置
            Toast.makeText(context, "服药监测已启动", Toast.LENGTH_SHORT).show()
        }
    }
}
