import {
  getAllMedicines,
  getMedicineById,
  createMedicine as dbCreateMedicine,
  updateMedicine as dbUpdateMedicine,
  deleteMedicine as dbDeleteMedicine,
  getLowStockMedicines as dbGetLowStockMedicines
} from '@/db/dao/medicineDao.js'
import {
  getAllSchedules,
  getScheduleById,
  createSchedule as dbCreateSchedule,
  updateSchedule as dbUpdateSchedule,
  deleteSchedule as dbDeleteSchedule
} from '@/db/dao/scheduleDao.js'
import {
  getTodayMedications as dbGetTodayMedications,
  takeMedication as dbTakeMedication,
  cancelTakeMedication as dbCancelTakeMedication,
  supplementRecord as dbSupplementRecord,
  getMedicationHistory as dbGetMedicationHistory
} from '@/db/dao/recordDao.js'
import { getAllCheckItems } from '@/db/dao/checkItemDao.js'
import {
  getAllCheckRecords,
  createCheckRecord as dbCreateCheckRecord,
  updateCheckRecord as dbUpdateCheckRecord,
  deleteCheckRecord as dbDeleteCheckRecord,
  getCompletionRate as dbGetCompletionRate,
  getCheckTrends as dbGetCheckTrends,
  getLatestChecks as dbGetLatestChecks
} from '@/db/dao/checkRecordDao.js'
import { login as localLogin, logout as localLogout } from '@/db/dao/authDao.js'

function toPromise(fn) {
  return (...args) => Promise.resolve(fn(...args))
}

function toAsyncPromise(fn) {
  return async (...args) => {
    const result = await fn(...args)
    return Promise.resolve(result)
  }
}

function convertMedicineFromDB(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    specification: row.specification,
    stockQuantity: row.stock_quantity,
    perBoxQuantity: row.per_box_quantity,
    purchaseDate: row.purchase_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function convertScheduleFromDB(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    medicineId: row.medicine_id,
    scheduleType: row.schedule_type,
    timesConfig: row.times_config ? JSON.parse(row.times_config) : null,
    dosageConfig: row.dosage_config ? JSON.parse(row.dosage_config) : null,
    intervalDays: row.interval_days,
    weekDays: row.week_days,
    startDate: row.start_date,
    endDate: row.end_date,
    isActive: row.is_active === 1 || row.is_active === true,
    scheduleTime: row.schedule_time,
    createdAt: row.created_at,
    medicines: (row.medicines || []).map(m => ({
      id: m.id,
      medicineId: m.medicine_id,
      medicineName: m.medicine_name,
      specification: m.specification,
      dosage: parseFloat(m.dosage)
    }))
  }
}

function convertRecordFromDB(row) {
  if (!row) return null
  return {
    id: row.id,
    recordId: row.id,
    scheduleId: row.schedule_id,
    scheduledTime: row.scheduled_time,
    actualTime: row.actual_time,
    status: row.status,
    createdAt: row.created_at,
    scheduleName: row.schedule_name,
    scheduleType: row.schedule_type,
    scheduleTime: row.schedule_time,
    timesConfig: row.times_config ? JSON.parse(row.times_config) : null,
    dosageConfig: row.dosage_config ? JSON.parse(row.dosage_config) : null,
    medicines: (row.medicines || []).map(m => ({
      id: m.id,
      medicineId: m.medicine_id,
      medicineName: m.medicine_name,
      specification: m.specification,
      dosage: parseFloat(m.dosage),
      stockQuantity: m.stock_quantity
    }))
  }
}

function convertCheckItemFromDB(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    referenceMin: row.reference_min,
    referenceMax: row.reference_max,
    isPreset: row.is_preset === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at
  }
}

function convertCheckRecordFromDB(row) {
  if (!row) return null
  return {
    id: row.id,
    checkItemId: row.check_item_id,
    check_date: row.check_date,
    checkDate: row.check_date,
    value: row.value,
    report_image: row.report_image,
    reportImage: row.report_image,
    createdAt: row.created_at,
    item_name: row.item_name,
    itemName: row.item_name,
    unit: row.unit,
    reference_min: row.reference_min,
    referenceMin: row.reference_min,
    reference_max: row.reference_max,
    referenceMax: row.reference_max,
    isNormal: row.isNormal
  }
}

export const getMedicines = () => {
  return Promise.resolve(getAllMedicines().map(convertMedicineFromDB))
}

export const getMedicine = (id) => {
  return Promise.resolve(convertMedicineFromDB(getMedicineById(id)))
}

export const createMedicine = (data) => {
  return Promise.resolve(convertMedicineFromDB(dbCreateMedicine(data)))
}

export const updateMedicine = (id, data) => {
  return Promise.resolve(convertMedicineFromDB(dbUpdateMedicine(id, data)))
}

export const deleteMedicine = (id) => {
  dbDeleteMedicine(id)
  return Promise.resolve({ success: true })
}

export const getLowStockMedicines = () => {
  return Promise.resolve(dbGetLowStockMedicines().map(convertMedicineFromDB))
}

export const getSchedules = () => {
  return Promise.resolve(getAllSchedules().map(convertScheduleFromDB))
}

export const getSchedule = (id) => {
  return Promise.resolve(convertScheduleFromDB(getScheduleById(id)))
}

export const createSchedule = (data) => {
  return Promise.resolve(convertScheduleFromDB(dbCreateSchedule(data)))
}

export const updateSchedule = (id, data) => {
  return Promise.resolve(convertScheduleFromDB(dbUpdateSchedule(id, data)))
}

export const deleteSchedule = (id) => {
  dbDeleteSchedule(id)
  return Promise.resolve({ success: true })
}

export const getTodayMedications = (date) => {
  return Promise.resolve(dbGetTodayMedications(date).map(convertRecordFromDB))
}

export const takeMedication = (data) => {
  return Promise.resolve(convertRecordFromDB(dbTakeMedication(data.recordId)))
}

export const cancelTakeMedication = (data) => {
  return Promise.resolve(convertRecordFromDB(dbCancelTakeMedication(data.recordId)))
}

export const supplementRecord = (data) => {
  return Promise.resolve(convertRecordFromDB(dbSupplementRecord(data.recordId, data.supplementTime)))
}

export const getMedicationHistory = (params) => {
  return Promise.resolve(dbGetMedicationHistory(params).map(convertRecordFromDB))
}

export const getCheckItems = () => {
  return Promise.resolve(getAllCheckItems().map(convertCheckItemFromDB))
}

export const getCheckRecords = (params) => {
  return Promise.resolve(getAllCheckRecords(params).map(convertCheckRecordFromDB))
}

export const createCheckRecord = (data) => {
  return Promise.resolve(convertCheckRecordFromDB(dbCreateCheckRecord(data)))
}

export const updateCheckRecord = (id, data) => {
  return Promise.resolve(convertCheckRecordFromDB(dbUpdateCheckRecord(id, data)))
}

export const deleteCheckRecord = (id) => {
  dbDeleteCheckRecord(id)
  return Promise.resolve({ success: true })
}

export const uploadImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result
      localStorage.setItem(`upload_${Date.now()}`, base64)
      resolve({ url: base64 })
    }
    reader.readAsDataURL(file)
  })
}

export const getCompletionRate = (params) => {
  return Promise.resolve(dbGetCompletionRate(params.startDate, params.endDate))
}

export const getCheckTrends = (params) => {
  return Promise.resolve(dbGetCheckTrends(params))
}

export const getLatestChecks = () => {
  return Promise.resolve(dbGetLatestChecks().map(convertCheckRecordFromDB))
}

export const login = (data) => {
  const result = localLogin(data.username, data.password)
  if (result.success) {
    return Promise.resolve({
      data: {
        token: result.token,
        username: result.username
      }
    })
  }
  return Promise.reject(new Error(result.message))
}

export const logout = () => {
  localLogout()
  return Promise.resolve({ success: true })
}
