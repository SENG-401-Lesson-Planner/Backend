import mysql from 'mysql';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_DATABASE = process.env.DB_DATABASE;
const JWT_SECRET = process.env.JWT_SECRET;

const connection = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
});

const DatabaseConnector = {
    connectToDatabase() {
        connection.connect((err) => {
            if (err) {
                console.error('Error connecting to the database:', err.stack);
                return;
            }
            console.log('Connected to the database as id ' + connection.threadId);
        });
    },

    useDatabase() {
        connection.changeUser({ database: DB_DATABASE }, (err) => {
            if (err) {
                console.error('Error changing to database:', err.stack);
                return;
            }
            console.log(`Using database ${DB_DATABASE}.`);
        });
    },

    async hashPassword(password) {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    },

    async comparePassword(password, hash) {
        return await bcrypt.compare(password, hash);
    },

    checkUserExists(username, callback) {
        const query = 'SELECT COUNT(*) AS count FROM Users WHERE username = ?';
        connection.query(query, [username], (err, results) => {
            if (err) {
                console.error('Error checking user in database:', err.stack);
                callback(err, null);
                return;
            }
            const userExists = results[0].count > 0;
            callback(null, userExists);
        });
    },

    generateToken(username, hashed_password) {
        const payload = { username: username, password: hashed_password };
        return jwt.sign(payload, JWT_SECRET);
    },

    verifyToken(token, callback) {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, decoded);
        });
    },

    addNewUserToDatabase(username, password, callback) {
        this.hashPassword(password).then((hash) => {
            const query = 'INSERT INTO Users (username, password_hash) VALUES (?, ?)';
            connection.query(query, [username, hash], (err, results) => {
                if (err) {
                    console.error('Error adding user to database:', err.stack);
                    callback(err, null);
                    return;
                }
                const token = this.generateToken(username, hash);
                callback(null, token);
            });
        });
    },

    loginToDatabase(username, password, callback) {
        const query = 'SELECT * FROM Users WHERE username = ?';
        connection.query(query, [username], async (err, results) => {
            if (err) {
                console.error('Error logging in to database:', err.stack);
                callback(err, null);
                return;
            }
            if (results.length === 0) {
                callback(null, null);
                return;
            }
            const user = results[0];
            const passwordMatch = await this.comparePassword(password, user.password_hash);
            if (passwordMatch) {
                const token = this.generateToken(username, user.password);
                callback(null, token);
            } else {
                callback(null, null);
            }
        });
    },

    getReponseHistoryFromUser(username, callback) {
        const query = 'SELECT * FROM Responses WHERE username = ?';
        connection.query(query, [username], (err, results) => {
            if (err) {
                console.error('Error getting response history:', err.stack);
                callback(err, null);
                return;
            }
            callback(null, results);
        });
    },

    addResponseToDatabase(id, response, callback) {
        const query = 'INSERT INTO Responses (user_id, response) VALUES (?, ?)';
        connection.query(query, [id, response], (err, results) => {
            if (err) {
                console.error('Error adding response to database:', err.stack);
                callback(err, null);
                return;
            }
            callback(null, results);
        });
    }
    
};

export default DatabaseConnector;
