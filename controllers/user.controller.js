const { up, down } = require('../db/migrations/20230604182023_create_users');
const knex = require('../db/knex');
const { hashPassword, checkHashPassword } = require('../helpers/hash');
const { seed } = require('../db/seeds/01_users');
const jwt = require('jsonwebtoken');

const migrateUp = async function () {
    await up(knex);
    console.log('Migration up completed');
};

const migrateDown = async function () {
    await down(knex);
    console.log('Migration down completed');
};


const seedData = async function () {
    await seed.run(knex);
    console.log('Data seeded successfully');
};

const getAllUsers = function (req, res) {
    const page = parseInt(req.query.page); 
    const limit = 2; 
    const search = req.query.search || ''; 
    if (page) {
      const offset = (page - 1) * limit; // Calculate the offset
  
      knex('users')
        .select()
        .where(builder => {
          if (search) {
            builder
              .where('username', 'like', `%${search}%`)
              .orWhere('name', 'like', `%${search}%`);
          }
        })
        .limit(limit)
        .offset(offset)
        .then(function (users) {
          res.send(users);
        })
        .catch(err => {
          console.error(err); 
          return res.status(500).json({ error: 'Internal server error' });
        });
    } else {
      knex('users')
        .select()
        .where(builder => {
          if (search) {
            builder
              .where('username', 'like', `%${search}%`)
              .orWhere('name', 'like', `%${search}%`);
          }
        })
        .then(function (users) {
          res.send(users);
        })
        .catch(err => {
          console.error(err); 
          return res.status(500).json({ error: 'Internal server error' });
        });
    }
  };
  
  
// get user by id
const getUserById = function (req, res) {
    knex('users').select().where('id', req.params.id).then(function (users) {
        res.send(users);
    }
    );
};
// register new user
const register = function (req, res) {
    const {
        username,
        password,
        name,
        age,
        email,
        gender
    } = req.body;
    // check if the username is already in the database
    knex('users').where('username', username)
        .then(rows => {
            console.log(rows);
            if (rows.length > 0) {
                return res.status(400).json({
                    message: 'Username already exists'
                });
            } else {
                const { salt, hashedPassword } = hashPassword(password);
                const hashedPasswordString = hashedPassword.toString('base64');
                return knex('users').insert({
                    username: username,
                    password: hashedPasswordString,
                    salt: salt,
                    name: name,
                    age: age,
                    email: email,
                    gender: gender
                }).then(() => {
                    return res.status(201).json({
                        message: 'User created successfully'
                    });
                }).catch(err => {
                    throw err;
                });
            }
        })
        .catch(err => {
            throw err;
        });
}

// create new user after login
const createUser = function (req, res) {
    const {
        username,
        password,
        name,
        age,
        email,
        gender
    } = req.body;
    const createdBy = req.session.id;
    // check if the username is already in the database
    knex('users').where('username', username)
        .then(rows => {
            console.log(rows);
            if (rows.length > 0) {
                return res.status(400).json({
                    message: 'Username already exists'
                });
            } else {
                const { salt, hashedPassword } = hashPassword(password);
                const hashedPasswordString = hashedPassword.toString('base64');
                const newUser = {
                    username: username,
                    password: hashedPasswordString,
                    salt: salt,
                    name: name,
                    age: age,
                    email: email,
                    gender: gender,
                    created_by: createdBy 
                };
                return knex('users').insert(newUser).then(() => {
                    return newUser;
                }).then((user) => {
                    // Create a new token for the registered user
                    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
                    // Attach the token to the response header
                    res.setHeader('Authorization', `Bearer ${token}`);
                    return res.status(201).json({
                        message: 'User created successfully'
                    });
                }).catch(err => {
                    throw err;
                });
            }
        })
        .catch(err => {
            throw err;
        });
}


// update user
const updateUser = function (req, res) {
    const id = req.params.id; 
    const {
        username,
        password = '', 
        name,
        age,
        email,
        gender
    } = req.body;

    knex('users')
        .where('id', id)
        .then(result => {
            if (result.length === 0) {
                return res.status(400).json({ error: 'User not found' });
            }
            // if have change password
            if (password) {
                const { salt, hashedPassword } = hashPassword(password);
                const hashedPasswordString = hashedPassword.toString('base64');
                knex('users')
                    .where('id', id)
                    .update({
                        username: username,
                        password: hashedPasswordString,
                        salt: salt,
                        name: name,
                        age: age,
                        email: email,
                        gender: gender
                    })
                    .then(() => {
                        return res.status(200).json({
                            message: 'User updated successfully'
                        });
                    })
                    .catch(err => {
                        console.error(err); 
                        return res.status(500).json({ error: 'Internal server error' });
                    });
            } else {
                knex('users')
                    .where('id', id)
                    .update({
                        username: username,
                        name: name,
                        age: age,
                        email: email,
                        gender: gender
                    })
                    .then(() => {
                        return res.status(200).json({
                            message: 'User updated successfully'
                        });
                    })
                    .catch(err => {
                        console.error(err); 
                        return res.status(500).json({ error: 'Internal server error' });
                    });
            }
        })
        .catch(err => {
            console.error(err); 
            return res.status(500).json({ error: 'Internal server error' });
        });
};

// delete user
const deleteUser = function (req, res) {
    knex('users').where('id', req.params.id).del().then(function () {
        res.send('user deleted');
    }
    );
}


// login
const login = (req, res) => {
    const { username, password } = req.body;
    knex('users').where('username', username)
        .then(rows => {
            if (rows.length > 0) {
                const user = rows[0];
                const hashedPassword = checkHashPassword(password, user.salt);
                if (hashedPassword.toString('base64') === user.password) {
                    const secretKey = process.env.JWT_SECRET || "";
                    const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: '24h' });
                    return res.status(200).json({
                        message: 'Login successful',
                        token
                    });
                } else {
                    return res.status(400).json({
                        message: 'Wrong password'
                    });
                }
            } else {
                return res.status(400).json({
                    message: 'User not found'
                });
            }
        })
        .catch(err => {
            throw err;
        });
}

module.exports = {
    getAllUsers,
    getUserById,
    register,
    createUser,
    updateUser,
    deleteUser,
    migrateUp,
    migrateDown,
    seedData,
    login
}

