const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');


db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero TEXT NULL,
        nome TEXT NULL,
        is_already_answered INTEGER DEFAULT 0
    )`);
});


function createContact(numero, nome, callback) {
    const stmt = db.prepare(`INSERT INTO contacts (numero, nome, is_already_answered) VALUES (?, ?, 0)`);
    stmt.run(numero, nome, function (err) {
        if (err) {
            return callback(err);
        }
        callback(null, { id: this.lastID });
    });
    stmt.finalize();
}


function readContacts(callback) {
    db.all(`SELECT * FROM contacts`, (err, rows) => {
        if (err) {
            return callback(err);
        }
        callback(null, rows);
    });
}


function updateContact(numero, nome, isAlreadyAnswered, callback) {
    const stmt = db.prepare(`UPDATE contacts SET nome = ?, is_already_answered = ? WHERE numero = ?`);
    stmt.run(nome, isAlreadyAnswered, numero, function (err) {
        if (err) {
            return callback(err);
        }
        callback(null, {
            changes: this.changes
        });
    });
    stmt.finalize();
}


function deleteContact(id, callback) {
    const stmt = db.prepare(`DELETE FROM contacts WHERE id = ?`);
    stmt.run(id, function (err) {
        if (err) {
            return callback(err);
        }
        callback(null, { changes: this.changes });
    });
    stmt.finalize();
}

function numberExists(numero, callback) {
    const stmt = db.prepare(`SELECT COUNT(*) as count FROM contacts WHERE numero = ?`);
    stmt.get(numero, (err, row) => {
        if (err) {
            return callback(err);
        }
        callback(null, row.count > 0);
    });
    stmt.finalize();
}

function isAlreadyAnswered(numero, callback) {
    const stmt = db.prepare(`SELECT is_already_answered FROM contacts WHERE numero = ?`);
    stmt.get(numero, (err, row) => {
        if (err) {
            return callback(err);
        }
        callback(null, row && row.is_already_answered > 0);
    });
    stmt.finalize();
}
module.exports = {
    createContact,
    readContacts,
    updateContact,
    deleteContact,
    numberExists,
    isAlreadyAnswered
};
