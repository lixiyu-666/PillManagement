import { query, run, getLastInsertRowId } from '../database.js'
import { getCheckItemById } from './checkItemDao.js'

export function getAllCheckRecords(params = {}) {
  const { checkItemId, startDate, endDate } = params
  let sql = `
    SELECT cr.id, cr.check_item_id, cr.check_date, cr.value, cr.report_image, cr.created_at,
           ci.name as item_name, ci.unit, ci.reference_min, ci.reference_max
    FROM check_record cr
    LEFT JOIN check_item ci ON cr.check_item_id = ci.id
    WHERE 1=1
  `
  const paramsArr = []
  
  if (checkItemId) {
    sql += ` AND cr.check_item_id = ?`
    paramsArr.push(checkItemId)
  }
  if (startDate) {
    sql += ` AND cr.check_date >= ?`
    paramsArr.push(startDate)
  }
  if (endDate) {
    sql += ` AND cr.check_date <= ?`
    paramsArr.push(endDate)
  }
  
  sql += ` ORDER BY cr.check_date DESC, cr.created_at DESC`
  
  const records = query(sql, paramsArr)
  
  return records.map(record => {
    const item = getCheckItemById(record.check_item_id)
    let isNormal = true
    
    if (item && record.value) {
      const value = parseFloat(record.value)
      if (item.reference_min && value < parseFloat(item.reference_min)) {
        isNormal = false
      }
      if (item.reference_max && value > parseFloat(item.reference_max)) {
        isNormal = false
      }
    }
    
    return {
      ...record,
      isNormal
    }
  })
}

export function getCheckRecordById(id) {
  return query(`SELECT * FROM check_record WHERE id = ?`, [id])[0]
}

export function createCheckRecord(record) {
  run(`
    INSERT INTO check_record (check_item_id, check_date, value, report_image)
    VALUES (?, ?, ?, ?)
  `, [
    record.checkItemId,
    record.checkDate,
    record.value,
    record.reportImage || null
  ])
  return getCheckRecordById(getLastInsertRowId())
}

export function updateCheckRecord(id, record) {
  run(`
    UPDATE check_record SET 
      check_item_id = ?, 
      check_date = ?, 
      value = ?,
      report_image = ?
    WHERE id = ?
  `, [
    record.checkItemId,
    record.checkDate,
    record.value,
    record.reportImage || null,
    id
  ])
  return getCheckRecordById(id)
}

export function deleteCheckRecord(id) {
  run(`DELETE FROM check_record WHERE id = ?`, [id])
}

export function getCompletionRate(startDate, endDate) {
  const records = query(`
    SELECT status, COUNT(*) as count
    FROM medication_record
    WHERE scheduled_time >= ? AND scheduled_time <= ?
    GROUP BY status
  `, [`${startDate} 00:00:00`, `${endDate} 23:59:59`])
  
  const stats = { taken: 0, pending: 0, missed: 0, supplemented: 0, total: 0 }
  
  records.forEach(r => {
    stats.total += r.count
    switch (r.status) {
      case 'TAKEN':
        stats.taken = r.count
        break
      case 'PENDING':
        stats.pending = r.count
        break
      case 'MISSED':
        stats.missed = r.count
        break
      case 'SUPPLEMENTED':
        stats.supplemented = r.count
        break
    }
  })
  
  if (stats.total > 0) {
    stats.rate = Math.round((stats.taken + stats.supplemented) / stats.total * 100)
  } else {
    stats.rate = 0
  }
  
  return stats
}

export function getCheckTrends(params = {}) {
  const { days = 30 } = params
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  const records = query(`
    SELECT cr.check_item_id, ci.name, cr.check_date, cr.value
    FROM check_record cr
    LEFT JOIN check_item ci ON cr.check_item_id = ci.id
    WHERE cr.check_date >= ? AND cr.check_date <= ?
    ORDER BY cr.check_date ASC
  `, [startDate, endDate])
  
  const trends = {}
  
  records.forEach(r => {
    if (!trends[r.check_item_id]) {
      trends[r.check_item_id] = {
        name: r.name,
        data: []
      }
    }
    trends[r.check_item_id].data.push({
      date: r.check_date,
      value: parseFloat(r.value)
    })
  })
  
  return Object.values(trends)
}

export function getLatestChecks() {
  const records = query(`
    SELECT cr.id, cr.check_item_id, cr.check_date, cr.value, cr.report_image,
           ci.name as item_name, ci.unit, ci.reference_min, ci.reference_max
    FROM check_record cr
    LEFT JOIN check_item ci ON cr.check_item_id = ci.id
    WHERE cr.id IN (
      SELECT MAX(id) FROM check_record GROUP BY check_item_id
    )
    ORDER BY cr.check_date DESC
  `)
  
  return records.map(record => {
    let isNormal = true
    
    if (record.reference_min && record.value) {
      const value = parseFloat(record.value)
      if (value < parseFloat(record.reference_min)) {
        isNormal = false
      }
      if (record.reference_max && value > parseFloat(record.reference_max)) {
        isNormal = false
      }
    }
    
    return {
      ...record,
      isNormal
    }
  })
}
