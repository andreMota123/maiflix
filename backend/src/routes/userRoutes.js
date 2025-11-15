const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
} = require('../controllers/userController');

const { protect, admin } = require('../middlewares/authMiddleware');

// All routes in this file are protected and require admin privileges
router.use(protect, admin);

router.route('/')
  .get(getAllUsers)
  .post(createUser);

router.route('/:id')
  .put(updateUser)
  .delete(deleteUser);
  
router.route('/:id/status')
  .put(updateUserStatus);

module.exports = router;
