// scripts/cleanup-expired-holds.ts
// Script para limpiar reservas temporales expiradas

import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

async function cleanupExpiredHolds() {
  try {
    const result = await pool.query(`
      DELETE FROM reservation_holds 
      WHERE expires_at < NOW()
      RETURNING id, court_id, expires_at
    `)
    
    console.log(`✅ Cleaned up ${result.rowCount} expired reservation holds`)
    
    if (result.rows.length > 0) {
      console.log('Expired holds removed:', result.rows)
    }
    
  } catch (error) {
    console.error('❌ Error cleaning up expired holds:', error)
  }
}

// Ejecutar la limpieza
cleanupExpiredHolds()
  .then(() => {
    console.log('🔄 Cleanup completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error)
    process.exit(1)
  })