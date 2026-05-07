import { query, run, getLastInsertRowId } from '../database.js'

export function getAllCheckItems() {
  return query(`
    SELECT id, name, unit, reference_min, reference_max, is_preset, sort_order, created_at
    FROM check_item 
    ORDER BY sort_order ASC, id ASC
  `)
}

export function getCheckItemById(id) {
  return query(`SELECT * FROM check_item WHERE id = ?`, [id])[0]
}

export function createCheckItem(item) {
  run(`
    INSERT INTO check_item (name, unit, reference_min, reference_max, is_preset, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    item.name,
    item.unit || null,
    item.referenceMin || null,
    item.referenceMax || null,
    item.isPreset ? 1 : 0,
    item.sortOrder || 0
  ])
  return getCheckItemById(getLastInsertRowId())
}

export function updateCheckItem(id, item) {
  run(`
    UPDATE check_item SET 
      name = ?, 
      unit = ?, 
      reference_min = ?, 
      reference_max = ?,
      sort_order = ?
    WHERE id = ?
  `, [
    item.name,
    item.unit || null,
    item.referenceMin || null,
    item.referenceMax || null,
    item.sortOrder || 0,
    id
  ])
  return getCheckItemById(id)
}

export function deleteCheckItem(id) {
  run(`DELETE FROM check_item WHERE id = ?`, [id])
}

export function getPresetCheckItems() {
  return query(`
    SELECT id, name, unit, reference_min, reference_max
    FROM check_item 
    WHERE is_preset = 1
    ORDER BY sort_order ASC
  `)
}
