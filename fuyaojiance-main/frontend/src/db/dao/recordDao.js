import { query, run, getLastInsertRowId } from '../database.js'
import { updateStock } from './medicineDao.js'
import dayjs from 'dayjs'

const STATUS = {
  PENDING: 'PENDING',
  TAKEN: 'TAKEN',
  MISSED: 'MISSED',
  SUPPLEMENTED: 'SUPPLEMENTED'
}

export function getTodayMedications(date) {
  const targetDate = date || dayjs().format('YYYY-MM-DD')
  const startOfDay = `${targetDate} 00:00:00`
  const endOfDay = `${targetDate} 23:59:59`
  
  const records = query(`
    SELECT mr.id, mr.schedule_id, mr.scheduled_time, mr.actual_time, mr.status,
           ms.name as schedule_name, ms.schedule_type, ms.schedule_time,
           ms.times_config, ms.dosage_config
    FROM medication_record mr
    LEFT JOIN medication_schedule ms ON mr.schedule_id = ms.id
    WHERE mr.scheduled_time >= ? AND mr.scheduled_time <= ?
    ORDER BY mr.scheduled_time ASC
  `, [startOfDay, endOfDay])
  
  return records.map(record => ({
    ...record,
    medicines: getMedicinesBySchedule(record.schedule_id)
  }))
}

function getMedicinesBySchedule(scheduleId) {
  return query(`
    SELECT sm.id, sm.medicine_id, sm.dosage,
           m.name as medicine_name, m.specification, m.stock_quantity
    FROM schedule_medicine sm
    LEFT JOIN medicine m ON sm.medicine_id = m.id
    WHERE sm.schedule_id = ?
  `, [scheduleId])
}

export function shouldTakeMedicineOnDate(schedule, date) {
  const targetDate = dayjs(date)
  
  if (schedule.startDate && targetDate.isBefore(dayjs(schedule.startDate))) {
    return false
  }
  if (schedule.endDate && targetDate.isAfter(dayjs(schedule.endDate))) {
    return false
  }
  
  switch (schedule.scheduleType) {
    case 'DAILY':
      return true
      
    case 'INTERVAL':
      if (!schedule.startDate || !schedule.intervalDays) return true
      const startDate = dayjs(schedule.startDate)
      const daysDiff = targetDate.diff(startDate, 'day')
      return daysDiff % schedule.intervalDays === 0
      
    case 'WEEKLY':
      if (!schedule.weekDays) return true
      const weekDays = schedule.weekDays.split(',').map(d => parseInt(d.trim()))
      const dayOfWeek = targetDate.day()
      return weekDays.includes(dayOfWeek)
      
    case 'COURSE':
      if (!schedule.startDate || !schedule.endDate) return true
      return targetDate.isBetween(dayjs(schedule.startDate), dayjs(schedule.endDate), 'day', '[]')
      
    default:
      return true
  }
}

export function generateDailyRecords(date) {
  const targetDate = dayjs(date).format('YYYY-MM-DD')
  const schedules = query(`
    SELECT id, name, schedule_type, dosage_config, times_config, schedule_time
    FROM medication_schedule 
    WHERE is_active = 1
  `)
  
  const existingRecords = query(`
    SELECT schedule_id, scheduled_time FROM medication_record
    WHERE scheduled_time LIKE ?
  `, [`${targetDate}%`])
  
  const existingMap = new Map()
  existingRecords.forEach(r => {
    existingMap.set(`${r.schedule_id}_${r.scheduled_time}`, true)
  })
  
  for (const schedule of schedules) {
    if (!shouldTakeMedicineOnDate(schedule, targetDate)) {
      continue
    }
    
    const times = getScheduleTimes(schedule)
    
    for (const time of times) {
      const scheduledTime = `${targetDate} ${time}:00`
      const key = `${schedule.id}_${scheduledTime}`
      
      if (!existingMap.has(key)) {
        run(`
          INSERT INTO medication_record (schedule_id, scheduled_time, status)
          VALUES (?, ?, 'PENDING')
        `, [schedule.id, scheduledTime])
      }
    }
  }
}

function getScheduleTimes(schedule) {
  const times = []
  
  if (schedule.schedule_time) {
    times.push(schedule.schedule_time)
  }
  
  if (schedule.times_config) {
    try {
      const config = JSON.parse(schedule.times_config)
      Object.keys(config).forEach(time => {
        if (!times.includes(time)) {
          times.push(time)
        }
      })
    } catch (e) {}
  }
  
  return times.length > 0 ? times : ['08:00']
}

export function takeMedication(recordId) {
  const record = query(`SELECT * FROM medication_record WHERE id = ?`, [recordId])[0]
  if (!record) throw new Error('记录不存在')
  
  const scheduleMedicines = getMedicinesBySchedule(record.schedule_id)
  
  for (const med of scheduleMedicines) {
    const dosage = parseFloat(med.dosage) || 1
    updateStock(med.medicine_id, -dosage)
  }
  
  run(`
    UPDATE medication_record SET 
      actual_time = datetime('now','localtime'),
      status = 'TAKEN'
    WHERE id = ?
  `, [recordId])
  
  return query(`SELECT * FROM medication_record WHERE id = ?`, [recordId])[0]
}

export function cancelTakeMedication(recordId) {
  const record = query(`SELECT * FROM medication_record WHERE id = ?`, [recordId])[0]
  if (!record) throw new Error('记录不存在')
  
  if (record.status === 'TAKEN' || record.status === 'SUPPLEMENTED') {
    const scheduleMedicines = getMedicinesBySchedule(record.schedule_id)
    
    for (const med of scheduleMedicines) {
      const dosage = parseFloat(med.dosage) || 1
      updateStock(med.medicine_id, dosage)
    }
  }
  
  run(`
    UPDATE medication_record SET 
      actual_time = NULL,
      status = 'PENDING'
    WHERE id = ?
  `, [recordId])
  
  return query(`SELECT * FROM medication_record WHERE id = ?`, [recordId])[0]
}

export function supplementRecord(recordId, supplementTime) {
  const record = query(`SELECT * FROM medication_record WHERE id = ?`, [recordId])[0]
  if (!record) throw new Error('记录不存在')
  
  const scheduleMedicines = getMedicinesBySchedule(record.schedule_id)
  
  for (const med of scheduleMedicines) {
    const dosage = parseFloat(med.dosage) || 1
    updateStock(med.medicine_id, -dosage)
  }
  
  run(`
    UPDATE medication_record SET 
      actual_time = ?,
      status = 'SUPPLEMENTED'
    WHERE id = ?
  `, [supplementTime, recordId])
  
  return query(`SELECT * FROM medication_record WHERE id = ?`, [recordId])[0]
}

export function getMedicationHistory(params = {}) {
  const { startDate, endDate, status } = params
  let sql = `
    SELECT mr.*, ms.name as schedule_name
    FROM medication_record mr
    LEFT JOIN medication_schedule ms ON mr.schedule_id = ms.id
    WHERE 1=1
  `
  const paramsArr = []
  
  if (startDate) {
    sql += ` AND mr.scheduled_time >= ?`
    paramsArr.push(`${startDate} 00:00:00`)
  }
  if (endDate) {
    sql += ` AND mr.scheduled_time <= ?`
    paramsArr.push(`${endDate} 23:59:59`)
  }
  if (status) {
    sql += ` AND mr.status = ?`
    paramsArr.push(status)
  }
  
  sql += ` ORDER BY mr.scheduled_time DESC LIMIT 100`
  
  return query(sql, paramsArr)
}

export { STATUS }
