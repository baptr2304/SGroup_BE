
const {getAllUsers, getUserById,register, createUser, updateUser,deleteUser,login} = require('../controllers/user.controller');
const {validateRegisterRequest,validateLoginRequest} = require('../middleware/user.validation.middleware');
const authenticate = require('../middleware/authen.middleware');
const express = require('express');
const user_router = express.Router();

user_router.get('/users', getAllUsers);

user_router.get('/user/:id', getUserById);

user_router.post('/login', validateLoginRequest,login);

user_router.post('/register', validateRegisterRequest,register);

user_router.post('/createUser',validateRegisterRequest,authenticate,createUser);

user_router.put('/updateUser/:id', updateUser);

user_router.delete('/deleteUser/:id', deleteUser);

module.exports = user_router;
