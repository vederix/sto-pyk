const express = require('express');
const router = express.Router();
const { login, register, getTeknisiList, magicLogin, logout } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.get('/teknisi', getTeknisiList);
router.get('/magic-login', magicLogin);
router.post('/magic-login', magicLogin);

module.exports = router;
