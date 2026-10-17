
import sqlite3

connection = sqlite3.connect("civicfix.db")

connection.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT,
        photo_filename TEXT,
        ai_description TEXT,
        priority TEXT DEFAULT 'Medium',
        status TEXT DEFAULT 'Submitted',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
""")

connection.commit()
connection.close()

print("CivicFix database created successfully!")
