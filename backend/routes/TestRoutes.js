const express = require('express');
const router = express.Router();
const TestController = require('../controllers/TestController')
const authenticateToken = require('../middlewares/AuthMiddleware')

router.get('/', TestController.AllTest)
router.get('/:id', TestController.TestDetails)



module.exports = router