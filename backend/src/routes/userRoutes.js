const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  changeUserPassword,
  restoreUser,
} = require('../controllers/userController');

const { protect, admin } = require('../middlewares/authMiddleware');

// All routes in this file are protected and require admin privileges
router.use(protect, admin);

router.route('/')
  .get(getAllUsers)
  .post(createUser);

router.route('/:id')
  .patch(updateUser) // Use PATCH for partial updates
  .delete(deleteUser);
  
router.patch('/:id/status', updateUserStatus); // Use PATCH for partial updates
router.patch('/:id/password', changeUserPassword); // New route for changing password
router.patch('/:id/restore', restoreUser); // New route for restoring user

module.exports = router;