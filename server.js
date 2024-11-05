const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Session management
app.use(session({
    secret: 'your_secret_key', // Replace with your own secret
    resave: false,
    saveUninitialized: true
}));

// Set up MySQL connection
const db = mysql.createConnection({
    host: 'quiz-app-db.clq6u2g8sgao.us-east-1.rds.amazonaws.com',
    port: 3306,
    user: 'admin',
    password: 'Cardinals12!',
    database: 'quiz_app-db'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database');
});

// Middleware to protect routes
function checkAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        console.log("User not authenticated - redirecting to login");
        res.redirect('/');
    }
}

// Serve login.html by default
app.get('/', (req, res) => {
    console.log("Root route hit - serving login.html");
    const filePath = path.join(__dirname, 'public', 'login.html');
    res.sendFile(filePath);
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Login route
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const sql = 'SELECT * FROM users WHERE username = ?';
    db.query(sql, [username], (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            res.status(500).json({ success: false, message: 'Server error' });
            return;
        }

        if (results.length === 0) {
            res.status(400).json({ success: false, message: 'User not found' });
            return;
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, match) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                res.status(500).json({ success: false, message: 'Server error' });
                return;
            }

            if (match) {
                // Passwords match, create session
                req.session.user = { id: user.id, username: user.username };

                // Redirect to index.html after successful login
                res.redirect('/index.html');
            } else {
                // Passwords don't match
                res.status(400).json({ success: false, message: 'Incorrect password' });
            }
        });
    });
});

// Registration route
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;

    const sqlCheckUser = 'SELECT * FROM users WHERE username = ?';
    db.query(sqlCheckUser, [username], (err, results) => {
        if (err) {
            console.error('Error checking user:', err);
            res.status(500).json({ success: false, message: 'Server error' });
            return;
        }

        if (results.length > 0) {
            res.status(400).json({ success: false, message: 'Username already exists' });
            return;
        }

        // Hash the password before saving it to the database
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                console.error('Error hashing password:', err);
                res.status(500).json({ success: false, message: 'Server error' });
                return;
            }

            const sqlInsertUser = 'INSERT INTO users (username, password) VALUES (?, ?)';
            db.query(sqlInsertUser, [username, hash], (err, result) => {
                if (err) {
                    console.error('Error inserting user:', err);
                    res.status(500).json({ success: false, message: 'Server error' });
                    return;
                }

                // Create a session for the user
                req.session.user = { id: result.insertId, username: username };

                // Redirect to index.html after successful registration
                res.redirect('/index.html');
            });
        });
    });
});

// Protect routes with checkAuth middleware
app.get('/index.html', checkAuth, (req, res) => {
    const filePath = path.join(__dirname, 'public', 'index.html');
    res.sendFile(filePath);
});

app.get('/quiz-creation.html', checkAuth, (req, res) => {
    const filePath = path.join(__dirname, 'public', 'quiz-creation.html');
    res.sendFile(filePath);
});

// You can similarly protect other routes:
app.get('/quiz-overview.html', checkAuth, (req, res) => {
    const filePath = path.join(__dirname, 'public', 'quiz-overview.html');
    res.sendFile(filePath);
});

app.get('/quiz.html', checkAuth, (req, res) => {
    const filePath = path.join(__dirname, 'public', 'quiz.html');
    res.sendFile(filePath);
});

app.get('/study.html', checkAuth, (req, res) => {
    const filePath = path.join(__dirname, 'public', 'study.html');
    res.sendFile(filePath);
});

// Route to create a new quiz
app.post('/api/quizzes', checkAuth, (req, res) => {
    const quiz = req.body;
    const userId = req.session.user.id; // Get the user ID from the session

    if (!quiz.name) {
        res.status(400).json({ error: 'Quiz name is required' });
        return;
    }

    const sqlInsertQuiz = 'INSERT INTO quizzes (name, user_id) VALUES (?, ?)';
    db.query(sqlInsertQuiz, [quiz.name, userId], (err, result) => {
        if (err) {
            console.error('Error inserting quiz:', err);
            res.status(500).send('Error creating quiz');
            return;
        }
        const quizId = result.insertId;

        // Prepare the questions
        const questions = quiz.questions.map(q => [quizId, q.question, userId]);

        // Insert questions and retrieve their IDs
        db.query('INSERT INTO questions (quiz_id, question_text, user_id) VALUES ?', [questions], (err, result) => {
            if (err) {
                console.error('Error inserting questions:', err);
                res.status(500).send('Error creating questions');
                return;
            }

            // Get the inserted question IDs
            const questionIds = result.insertId;
            const questionIdArray = [...Array(quiz.questions.length).keys()].map(i => questionIds + i);

            // Prepare the answers for batch insertion
            const answers = [];
            quiz.questions.forEach((q, index) => {
                q.answers.forEach(a => {
                    answers.push([questionIdArray[index], a.text, a.correct, userId]);
                });
            });

            // Insert answers
            db.query('INSERT INTO answers (question_id, answer_text, is_correct, user_id) VALUES ?', [answers], (err, result) => {
                if (err) {
                    console.error('Error inserting answers:', err);
                    res.status(500).json({ error: 'Error creating answers' });
                    return;
                }
                res.json({ message: 'Quiz added to database with questions and answers' });
            });
        });
    });
});

// Route to get all quizzes
app.get('/api/quizzes', checkAuth, (req, res) => {
    const userId = req.session.user.id;

    const sql = 'SELECT * FROM quizzes WHERE user_id = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.get('/api/quizzes/current', checkAuth, (req, res) => {
    const userId = req.session.user.id;

    const sql = `
        SELECT q.quiz_id AS quiz_id, q.id AS question_id, q.question_text, a.answer_text, a.is_correct, qu.name AS quiz_name
        FROM questions q
        LEFT JOIN answers a ON q.id = a.question_id
        LEFT JOIN quizzes qu ON q.quiz_id = qu.id
        WHERE q.quiz_id = (
            SELECT id FROM quizzes WHERE user_id = ? ORDER BY id DESC LIMIT 1
        ) AND qu.user_id = ?`;

    db.query(sql, [userId, userId], (err, results) => {
        if (err) {
            console.error('Error fetching the current quiz:', err);
            res.status(500).json({ error: 'Error fetching the current quiz' });
            return;
        }

        if (results.length === 0) {
            res.status(404).json({ error: 'No quiz found' });
            return;
        }

        const quiz = {
            id: results[0].quiz_id,
            name: results[0].quiz_name,  // Ensure quiz name is included
            questions: []
        };

        results.forEach(row => {
            let question = quiz.questions.find(q => q.id === row.question_id);
            if (!question) {
                question = {
                    id: row.question_id,
                    question: row.question_text,
                    answers: []
                };
                quiz.questions.push(question);
            }
            question.answers.push({
                text: row.answer_text,
                correct: row.is_correct
            });
        });

        res.json(quiz);
    });
});

app.get('/api/quizzes/:id', checkAuth, (req, res) => {
    const quizId = req.params.id;
    const userId = req.session.user.id;

    const sql = `
        SELECT q.quiz_id AS quiz_id, q.id AS question_id, q.question_text, a.answer_text, a.is_correct, qu.name AS quiz_name
        FROM questions q
        LEFT JOIN answers a ON q.id = a.question_id
        LEFT JOIN quizzes qu ON q.quiz_id = qu.id
        WHERE q.quiz_id = ? AND qu.user_id = ?`;

    db.query(sql, [quizId, userId], (err, results) => {
        if (err) {
            console.error('Error fetching the quiz:', err);
            res.status(500).json({ error: 'Error fetching the quiz' });
            return;
        }

        if (results.length === 0) {
            res.status(404).json({ error: 'No quiz found' });
            return;
        }

        const quiz = {
            id: results[0].quiz_id,
            name: results[0].quiz_name,
            questions: []
        };

        results.forEach(row => {
            let question = quiz.questions.find(q => q.id === row.question_id);
            if (!question) {
                question = {
                    id: row.question_id,
                    question: row.question_text,
                    answers: []
                };
                quiz.questions.push(question);
            }
            question.answers.push({
                text: row.answer_text,
                correct: row.is_correct
            });
        });

        res.json(quiz);
    });
});

// Route to update a quiz by ID, including questions and answers
app.put('/api/quizzes/:id', checkAuth, (req, res) => {
    const quizId = req.params.id;
    const updatedQuiz = req.body;
    const userId = req.session.user.id;

    if (!updatedQuiz.name) {
        res.status(400).json({ error: 'Quiz name is required' });
        return;
    }

    console.log('Starting transaction to update quiz:', quizId);

    // Begin transaction
    db.beginTransaction(err => {
        if (err) {
            console.error('Error starting transaction:', err);
            res.status(500).send('Error updating quiz');
            return;
        }

        console.log('Updating quiz name:', updatedQuiz.name);

        // Update the quiz name
        const sqlUpdateQuiz = 'UPDATE quizzes SET name = ? WHERE id = ? AND user_id = ?';
        db.query(sqlUpdateQuiz, [updatedQuiz.name, quizId, userId], (err, result) => {
            if (err || result.affectedRows === 0) {
                console.error('Error updating quiz:', err);
                return db.rollback(() => {
                    res.status(500).send('Error updating quiz');
                });
            }

            console.log('Updated quiz name. Proceeding to update questions...');

            // Continue with updating questions and answers as before
            const sqlUpdateQuestion = 'UPDATE questions SET question_text = ? WHERE id = ? AND quiz_id = ? AND user_id = ?';
            const questionPromises = updatedQuiz.questions.map(question => {
                return new Promise((resolve, reject) => {
                    db.query(sqlUpdateQuestion, [question.question, question.id, quizId, userId], (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });
            });

            Promise.all(questionPromises)
                .then(() => {
                    console.log('Updated all questions. Proceeding to commit transaction...');

                    db.commit(err => {
                        if (err) {
                            console.error('Error committing transaction:', err);
                            return db.rollback(() => {
                                res.status(500).send('Error updating quiz');
                            });
                        }
                        console.log('Transaction committed successfully');
                        res.json({ message: 'Quiz updated successfully' });
                    });
                })
                .catch(err => {
                    console.error('Error updating questions:', err);
                    db.rollback(() => {
                        res.status(500).send('Error updating quiz');
                    });
                });
        });
    });
});

// Route to delete a quiz by ID, including its associated questions and answers
app.delete('/api/quizzes/:id', checkAuth, (req, res) => {
    const quizId = req.params.id;
    const userId = req.session.user.id;

    // Begin transaction
    db.beginTransaction(err => {
        if (err) {
            console.error('Error starting transaction:', err);
            res.status(500).send('Error deleting quiz');
            return;
        }

        // Delete answers associated with the quiz
        const sqlDeleteAnswers = `
            DELETE a FROM answers a
            JOIN questions q ON a.question_id = q.id
            WHERE q.quiz_id = ? AND q.user_id = ?`;

        db.query(sqlDeleteAnswers, [quizId, userId], (err, result) => {
            if (err) {
                console.error('Error deleting answers:', err);
                return db.rollback(() => {
                    res.status(500).send('Error deleting quiz');
                });
            }

            // Delete questions associated with the quiz
            const sqlDeleteQuestions = 'DELETE FROM questions WHERE quiz_id = ? AND user_id = ?';

            db.query(sqlDeleteQuestions, [quizId, userId], (err, result) => {
                if (err) {
                    console.error('Error deleting questions:', err);
                    return db.rollback(() => {
                        res.status(500).send('Error deleting quiz');
                    });
                }

                // Finally, delete the quiz itself
                const sqlDeleteQuiz = 'DELETE FROM quizzes WHERE id = ? AND user_id = ?';

                db.query(sqlDeleteQuiz, [quizId, userId], (err, result) => {
                    if (err || result.affectedRows === 0) {
                        console.error('Error deleting quiz:', err);
                        return db.rollback(() => {
                            res.status(500).send('Error deleting quiz');
                        });
                    }

                    // Commit the transaction
                    db.commit(err => {
                        if (err) {
                            console.error('Error committing transaction:', err);
                            return db.rollback(() => {
                                res.status(500).send('Error deleting quiz');
                            });
                        }
                        res.json({ message: 'Quiz deleted successfully' });
                    });
                });
            });
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
