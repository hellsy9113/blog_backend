const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate, registerRules, loginRules } = require('../middleware/validate.middleware');

router.post('/register', registerRules, validate, authController.register);
router.post('/login',    loginRules,    validate, authController.login);
router.post('/refresh-token',          authController.refreshToken);

router.use(protect);
router.post('/logout', authController.logout);
router.get('/me',      authController.getMe);

module.exports = router;
