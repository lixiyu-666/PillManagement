import { query, run, getLastInsertRowId } from '../database.js'

function calculateDailyConsumption(medicineId) {
  const schedules = query(`
    SELECT schedule_type, dosage_config, interval_days, week_days, start_date, end_date
    FROM medication_schedule 
    WHERE is_active = 1
  `)
  
  let totalDaily = 0
  const today = new Date().toISOString().split('T')[0]
  
  for (const schedule of schedules) {
    if (!shouldCountSchedule(schedule, today)) {
      continue
    }
    
    let dailyDosage = 0
    if (schedule.dosage_config) {
      try {
        const config = JSON.parse(schedule.dosage_config)
        Object.values(config).forEach(val => {
          dailyDosage += parseFloat(val) || 0
        })
      } catch (e) {}
    }
    
    switch (schedule.schedule_type) {
      case 'DAILY':
      case 'COURSE':
        totalDaily += dailyDosage
        break
      case 'INTERVAL':
        if (schedule.interval_days && schedule.interval_days > 0) {
          totalDaily += dailyDosage / schedule.interval_days
        }
        break
      case 'WEEKLY':
        if (schedule.week_days) {
          const days = schedule.week_days.split(',').length
          totalDaily += dailyDosage * days / 7.0
        }
        break
    }
  }
  
  return totalDaily
}

function shouldCountSchedule(schedule, today) {
  if (schedule.start_date && today < schedule.start_date) {
    return false
  }
  if (schedule.end_date && today > schedule.end_date) {
    return false
  }
  return true
}

export function getAllMedicines() {
  const medicines = query(`
    SELECT id, name, specification, stock_quantity, per_box_quantity, 
           purchase_date, created_at, updated_at
    FROM medicine 
    ORDER BY created_at DESC
  `)
  
  return medicines.map(med => {
    const dailyConsumption = calculateDailyConsumption(med.id)
    if (dailyConsumption > 0 && med.stock_quantity > 0) {
      med.remainingDays = Math.floor(med.stock_quantity / dailyConsumption)
      med.stockWarning = med.remainingDays <= 7
    } else {
      med.remainingDays = null
      med.stockWarning = false
    }
    return med
  })
}

export function getMedicineById(id) {
  return query(`SELECT * FROM medicine WHERE id = ?`, [id])[0]
}

export function createMedicine(medicine) {
  run(`
    INSERT INTO medicine (name, specification, stock_quantity, per_box_quantity, purchase_date)
    VALUES (?, ?, ?, ?, ?)
  `, [
    medicine.name,
    medicine.specification || null,
    medicine.stockQuantity || 0,
    medicine.perBoxQuantity || 0,
    medicine.purchaseDate || null
  ])
  return getMedicineById(getLastInsertRowId())
}

export function updateMedicine(id, medicine) {
  run(`
    UPDATE medicine SET 
      name = ?, 
      specification = ?, 
      stock_quantity = ?, 
      per_box_quantity = ?, 
      purchase_date = ?,
      updated_at = datetime('now','localtime')
    WHERE id = ?
  `, [
    medicine.name,
    medicine.specification || null,
    medicine.stockQuantity || 0,
    medicine.perBoxQuantity || 0,
    medicine.purchaseDate || null,
    id
  ])
  return getMedicineById(id)
}

export function deleteMedicine(id) {
  run(`DELETE FROM medicine WHERE id = ?`, [id])
}

export function getLowStockMedicines(threshold = 10) {
  return query(`
    SELECT id, name, specification, stock_quantity, per_box_quantity, 
           purchase_date, created_at, updated_at
    FROM medicine 
    WHERE stock_quantity < ?
    ORDER BY stock_quantity ASC
  `, [threshold])
}

export function updateStock(medicineId, quantity) {
  run(`
    UPDATE medicine SET 
      stock_quantity = stock_quantity + ?,
      updated_at = datetime('now','localtime')
    WHERE id = ?
  `, [quantity, medicineId])
}
