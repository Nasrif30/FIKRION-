pub mod sqlite;
pub mod schema;

use once_cell::sync::OnceCell;
use rusqlite::Connection;
use std::sync::Mutex;

static DB: OnceCell<Mutex<Connection>> = OnceCell::new();

pub fn init() -> Result<(), Box<dyn std::error::Error>> {
    let data_dir = dirs_path();
    std::fs::create_dir_all(&data_dir)?;
    let db_path = data_dir.join("fikrion.db");
    let conn = Connection::open(db_path)?;
    schema::create_tables(&conn)?;
    DB.set(Mutex::new(conn)).ok();
    Ok(())
}

pub fn get() -> &'static Mutex<Connection> {
    DB.get().expect("Database not initialized")
}

fn dirs_path() -> std::path::PathBuf {
    dirs::data_local_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("FIKRION")
}
