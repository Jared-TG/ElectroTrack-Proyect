// mobile/app/services/database.ts
// Módulo de inicialización de SQLite local
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'electrotrack.db';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Inicializa la base de datos SQLite y crea las tablas necesarias.
 * Se debe llamar una sola vez al iniciar la app.
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync(DB_NAME);

  // Crear tabla de dispositivos locales
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS mis_dispositivos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      qr_code TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      icono TEXT DEFAULT NULL,
      tipo TEXT DEFAULT 'general',
      modelo TEXT,
      serial TEXT,
      estado TEXT DEFAULT 'en_espera',
      watts INTEGER DEFAULT 0,
      synced INTEGER DEFAULT 0,
      added_at TEXT DEFAULT (datetime('now'))
    );
  `);

  console.log('[SQLite] Base de datos inicializada correctamente');
  return db;
}

/**
 * Obtiene la referencia a la base de datos.
 * Lanza error si no se ha inicializado.
 */
export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Base de datos no inicializada. Llama a initDatabase() primero.');
  }
  return db;
}
