const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { logger } = require('./logger');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'modubot.db');
let db;

// Initialize database connection
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                logger.error('Error opening database:', err);
                reject(err);
            } else {
                logger.info('Connected to SQLite database');
                createTables().then(resolve).catch(reject);
            }
        });
    });
}

// Create necessary tables
async function createTables() {
    try {
        // First create the tables
        await createBaseTables();

        // Then run migrations to add missing columns
        await runMigrations();

        logger.success('All database tables created and migrated successfully');
    } catch (error) {
        logger.error('Error creating/migrating tables:', error);
        throw error;
    }
}

function createBaseTables() {
    return new Promise((resolve, reject) => {
        const tables = [
            // User warnings table
            `CREATE TABLE IF NOT EXISTS warnings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                moderator_id TEXT NOT NULL,
                reason TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Support tickets table
            `CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                channel_id TEXT UNIQUE NOT NULL,
                user_id TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                category TEXT DEFAULT 'general',
                status TEXT DEFAULT 'open',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                closed_at DATETIME NULL
            )`,
            
            // User XP/Level system
            `CREATE TABLE IF NOT EXISTS user_levels (
                user_id TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                xp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                messages_sent INTEGER DEFAULT 0,
                last_message DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, guild_id)
            )`,
            
            // Custom tags/responses
            `CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                name TEXT NOT NULL,
                content TEXT NOT NULL,
                author_id TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                uses INTEGER DEFAULT 0,
                UNIQUE(guild_id, name)
            )`,
            
            // Reminders
            `CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                channel_id TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                message TEXT NOT NULL,
                remind_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Server settings
            `CREATE TABLE IF NOT EXISTS guild_settings (
                guild_id TEXT PRIMARY KEY,
                prefix TEXT DEFAULT '!',
                mod_log_channel TEXT NULL,
                suggestion_channel TEXT NULL,
                support_category TEXT NULL,
                welcome_channel TEXT NULL,
                welcome_message TEXT NULL,
                max_warnings INTEGER DEFAULT 3,
                xp_enabled BOOLEAN DEFAULT 1,
                xp_per_message INTEGER DEFAULT 5,
                xp_cooldown INTEGER DEFAULT 60000,
                automod_enabled BOOLEAN DEFAULT 0,
                spam_filter BOOLEAN DEFAULT 0,
                link_filter BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        let completed = 0;
        tables.forEach((sql, index) => {
            db.run(sql, (err) => {
                if (err) {
                    logger.error(`Error creating table ${index}:`, err);
                    reject(err);
                } else {
                    completed++;
                    if (completed === tables.length) {
                        logger.info('Base database tables created successfully');
                        resolve();
                    }
                }
            });
        });
    });
}

// Run database migrations to add missing columns
async function runMigrations() {
    const migrations = [
        // Add missing columns to guild_settings if they don't exist
        `ALTER TABLE guild_settings ADD COLUMN xp_per_message INTEGER DEFAULT 5`,
        `ALTER TABLE guild_settings ADD COLUMN xp_cooldown INTEGER DEFAULT 60000`,
        `ALTER TABLE guild_settings ADD COLUMN automod_enabled BOOLEAN DEFAULT 0`,
        `ALTER TABLE guild_settings ADD COLUMN spam_filter BOOLEAN DEFAULT 0`,
        `ALTER TABLE guild_settings ADD COLUMN link_filter BOOLEAN DEFAULT 0`,
        `ALTER TABLE guild_settings ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE guild_settings ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`,

        // Add missing columns to user_levels if they don't exist
        `ALTER TABLE user_levels ADD COLUMN messages_sent INTEGER DEFAULT 0`,
        `ALTER TABLE user_levels ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`,

        // Add missing columns to tags if they don't exist
        `ALTER TABLE tags ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`,

        // Create setup history table
        `CREATE TABLE IF NOT EXISTS setup_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT NOT NULL,
            setup_type TEXT NOT NULL,
            completed_by TEXT NOT NULL,
            completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            results TEXT NULL
        )`,

        // Create verification logs table
        `CREATE TABLE IF NOT EXISTS verification_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            guild_id TEXT NOT NULL,
            role_id TEXT NOT NULL,
            verified_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // Create reaction roles table
        `CREATE TABLE IF NOT EXISTS reaction_roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT NOT NULL,
            channel_id TEXT NOT NULL,
            message_id TEXT NOT NULL,
            emoji TEXT NOT NULL,
            role_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(message_id, emoji)
        )`,

        // Create member logs table
        `CREATE TABLE IF NOT EXISTS member_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            guild_id TEXT NOT NULL,
            action TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    for (const migration of migrations) {
        try {
            await dbHelpers.run(migration);
            logger.info(`Migration executed: ${migration.substring(0, 50)}...`);
        } catch (error) {
            // Ignore "duplicate column name" errors as they mean the column already exists
            if (!error.message.includes('duplicate column name')) {
                logger.warn(`Migration failed (this may be normal): ${error.message}`);
            }
        }
    }
}

// Database helper functions
const dbHelpers = {
    // Get database instance
    getDB: () => db,
    
    // Run a query with parameters
    run: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    },
    
    // Get a single row
    get: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },
    
    // Get all rows
    all: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};

module.exports = {
    initializeDatabase,
    db: dbHelpers
};
