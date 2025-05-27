
import sqlite3 from 'sqlite3';
import path from 'path';
import { Customer, Order, CompanyInfo, ExchangeRates, Currency, ProductSuggestion } from '../src/types'; // Adjust path as needed
import { generateId, DEFAULT_COMPANY_INFO, INITIAL_EXCHANGE_RATES, DEFAULT_PRODUCT_UNITS, DEFAULT_CURRENCY } from '../src/constants'; // Adjust path

let db: sqlite3.Database;
const verboseSqlite = sqlite3.verbose(); // For more detailed logs

export const initDatabase = (userDataPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(userDataPath, 'evdekor_pro_data.sqlite');
    console.log(`Database path: ${dbPath}`);
    db = new verboseSqlite.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database', err.message);
        return reject(err);
      }
      console.log('Connected to the SQLite database.');
      createTables().then(resolve).catch(reject);
    });
  });
};

const run = (sql: string, params: any[] = []): Promise<{ id?: number; changes?: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) { // Use function() to access this.lastID
      if (err) {
        console.error('Error running sql:', sql, params, err.message);
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

const get = <T>(sql: string, params: any[] = []): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, result: T) => {
      if (err) {
        console.error('Error running sql:', sql, params, err.message);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

const all = <T>(sql: string, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows: T[]) => {
      if (err) {
        console.error('Error running sql:', sql, params, err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const createTables = async (): Promise<void> => {
  const createCustomersTable = `
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      createdAt TEXT NOT NULL
    );`;

  const createOrdersTable = `
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      orderNumber TEXT NOT NULL UNIQUE,
      customerId TEXT NOT NULL,
      customerNameSnapshot TEXT NOT NULL,
      date TEXT NOT NULL,
      sections TEXT NOT NULL, -- JSON
      currency TEXT NOT NULL,
      exchangeRatesSnapshot TEXT NOT NULL, -- JSON
      status TEXT NOT NULL,
      notes TEXT,
      itemsTotalTRY REAL NOT NULL,
      discounts TEXT, -- JSON
      totalDiscountAmountTRY REAL NOT NULL,
      subTotalAfterDiscountsTRY REAL NOT NULL,
      taxRate REAL,
      taxAmountTRY REAL,
      grandTotalTRY REAL NOT NULL,
      FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE 
    );`;
  // ON DELETE CASCADE for orders might be too aggressive if you want to keep orders of deleted customers.
  // For now, let's assume if a customer is deleted, their orders are less relevant or a soft delete strategy would be used in a more complex system.

  const createSettingsTable = `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );`;
    
  await run(createCustomersTable);
  await run(createOrdersTable);
  await run(createSettingsTable);

  // Initialize default settings if not present
  await initializeDefaultSetting('companyInfo', DEFAULT_COMPANY_INFO);
  await initializeDefaultSetting('exchangeRates', INITIAL_EXCHANGE_RATES);
  await initializeDefaultSetting('currentCurrency', DEFAULT_CURRENCY);
  await initializeDefaultSetting('productUnits', DEFAULT_PRODUCT_UNITS);
  await initializeDefaultSetting('productNameSuggestions', []);
  await initializeDefaultSetting('productDescriptionSuggestions', []);
  await initializeDefaultSetting('theme', 'light');
  await initializeDefaultSetting('orderCounter', 1);
  
  console.log('Tables created or already exist.');
};

const initializeDefaultSetting = async (key: string, defaultValue: any) => {
    const setting = await getSetting(key);
    if (setting === undefined) {
        await setSetting(key, defaultValue);
    }
};


// Generic CRUD operations
export const getAll = async (entity: string): Promise<any[]> => {
  const rows = await all<any>(`SELECT * FROM ${entity}`);
  if (entity === 'orders' || entity === 'settings') { // Deserialize JSON fields
    return rows.map(row => {
      if (row.sections) row.sections = JSON.parse(row.sections);
      if (row.exchangeRatesSnapshot) row.exchangeRatesSnapshot = JSON.parse(row.exchangeRatesSnapshot);
      if (row.discounts) row.discounts = JSON.parse(row.discounts);
      if (entity === 'settings' && row.value) row.value = JSON.parse(row.value);
      return row;
    });
  }
  return rows;
};

export const getById = async (entity: string, id: string): Promise<any | undefined> => {
  const row = await get<any>(`SELECT * FROM ${entity} WHERE id = ?`, [id]);
  if (row) {
      if (entity === 'orders') {
        if (row.sections) row.sections = JSON.parse(row.sections);
        if (row.exchangeRatesSnapshot) row.exchangeRatesSnapshot = JSON.parse(row.exchangeRatesSnapshot);
        if (row.discounts) row.discounts = JSON.parse(row.discounts);
      }
      // No JSON parsing needed for settings 'getById' as it's handled by getSetting
  }
  return row;
};

export const add = async (entity: string, data: any): Promise<any> => {
  // For orders, ensure complex fields are stringified
  if (entity === 'orders') {
    data.sections = JSON.stringify(data.sections || []);
    data.exchangeRatesSnapshot = JSON.stringify(data.exchangeRatesSnapshot || {});
    data.discounts = JSON.stringify(data.discounts || []);
  }

  const keys = Object.keys(data);
  const placeholders = keys.map(() => '?').join(', ');
  const values = Object.values(data);
  await run(`INSERT INTO ${entity} (${keys.join(', ')}) VALUES (${placeholders})`, values);
  // For SQLite, lastID might not be UUID, so we return the inserted data if ID was pre-generated
  // Or fetch it again if ID is auto-increment (but we use UUIDs/generated IDs)
  return data; // Assuming data contains the ID
};

export const update = async (entity: string, data: any): Promise<any> => {
   if (entity === 'orders') {
    data.sections = JSON.stringify(data.sections || []);
    data.exchangeRatesSnapshot = JSON.stringify(data.exchangeRatesSnapshot || {});
    data.discounts = JSON.stringify(data.discounts || []);
  }
  const { id, ...updateData } = data;
  const keys = Object.keys(updateData);
  const setClause = keys.map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updateData), id];
  await run(`UPDATE ${entity} SET ${setClause} WHERE id = ?`, values);
  return data;
};

export const deleteById = async (entity: string, id: string): Promise<void> => {
  await run(`DELETE FROM ${entity} WHERE id = ?`, [id]);
};


// Settings specific
export const getSetting = async <T>(key: string): Promise<T | undefined> => {
  const row = await get<{ key: string; value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? JSON.parse(row.value) as T : undefined;
};

export const setSetting = async (key: string, value: any): Promise<void> => {
  const jsonValue = JSON.stringify(value);
  await run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, jsonValue]);
};
