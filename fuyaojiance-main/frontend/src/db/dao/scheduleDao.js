import { query, run, getLastInsertRowId } from '../database.js'

export function getAllSchedules() {
  const schedules = query(`
    SELECT id, name, medicine_id, schedule_type, times_config, dosage_config,
           interval_days, week_days, start_date, end_date, is_active, 
           schedule_time, created_at
    FROM medication_schedule 
    ORDER BY schedule_time ASC
  `)
  
  return schedules.map(schedule => ({
    ...schedule,
    medicines: getScheduleMedicines(schedule.id)
  }))
}

export function getScheduleById(id) {
  const schedule = query(`
    SELECT id, name, medicine_id, schedule_type, times_config, dosage_config,
           interval_days, week_days, start_date, end_date, is_active, 
           schedule_time, created_at
    FROM medication_schedule 
    WHERE id = ?
  `, [id])[0]
  
  if (schedule) {
    schedule.medicines = getScheduleMedicines(id)
  }
  
  return schedule
}

function getScheduleMedicines(scheduleId) {
  return query(`
    SELECT sm.id, sm.medicine_id, sm.dosage, 
           m.name as medicine_name, m.specification
    FROM schedule_medicine sm
    LEFT JOIN medicine m ON sm.medicine_id = m.id
    WHERE sm.schedule_id = ?
  `, [scheduleId])
}

export function createSchedule(schedule) {
  run(`
    INSERT INTO medication_schedule 
    (name, schedule_type, times_config, dosage_config, interval_days, 
     week_days, start_date, end_date, is_active, schedule_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    schedule.name || null,
    schedule.scheduleType || 'DAILY',
    schedule.timesConfig ? JSON.stringify(schedule.timesConfig) : null,
    schedule.dosageConfig ? JSON.stringify(schedule.dosageConfig) : null,
    schedule.intervalDays || 1,
    schedule.weekDays || null,
    schedule.startDate || null,
    schedule.endDate || null,
    schedule.isActive !== undefined ? (schedule.isActive ? 1 : 0) : 1,
    schedule.scheduleTime || '08:00'
  ])
  
  const scheduleId = getLastInsertRowId()
  
  if (schedule.medicines && schedule.medicines.length > 0) {
    for (const med of schedule.medicines) {
      run(`
        INSERT INTO schedule_medicine (schedule_id, medicine_id, dosage)
        VALUES (?, ?, ?)
      `, [scheduleId, med.medicineId, med.dosage || '1.0'])
    }
  }
  
  return getScheduleById(scheduleId)
}

export function updateSchedule(id, schedule) {
  run(`
    UPDATE medication_schedule SET 
      name = ?, 
      schedule_type = ?, 
      times_config = ?, 
      dosage_config = ?,
      interval_days = ?, 
      week_days = ?, 
      start_date = ?, 
      end_date = ?, 
      is_active = ?,
      schedule_time = ?
    WHERE id = ?
  `, [
    schedule.name || null,
    schedule.scheduleType || 'DAILY',
    schedule.timesConfig ? JSON.stringify(schedule.timesConfig) : null,
    schedule.dosageConfig ? JSON.stringify(schedule.dosageConfig) : null,
    schedule.intervalDays || 1,
    schedule.weekDays || null,
    schedule.startDate || null,
    schedule.endDate || null,
    schedule.isActive !== undefined ? (schedule.isActive ? 1 : 0) : 1,
    schedule.scheduleTime || '08:00',
    id
  ])
  
  run(`DELETE FROM schedule_medicine WHERE schedule_id = ?`, [id])
  
  if (schedule.medicines && schedule.medicines.length > 0) {
    for (const med of schedule.medicines) {
      run(`
        INSERT INTO schedule_medicine (schedule_id, medicine_id, dosage)
        VALUES (?, ?, ?)
      `, [id, med.medicineId, med.dosage || '1.0'])
    }
  }
  
  return getScheduleById(id)
}

export function deleteSchedule(id) {
  run(`DELETE FROM schedule_medicine WHERE schedule_id = ?`, [id])
  run(`DELETE FROM medication_schedule WHERE id = ?`, [id])
}

export function getActiveSchedules() {
  return query(`
    SELECT id, name, schedule_type, dosage_config, interval_days, 
           week_days, start_date, end_date, schedule_time
    FROM medication_schedule 
    WHERE is_active = 1
    ORDER BY schedule_time ASC
  `)
}
