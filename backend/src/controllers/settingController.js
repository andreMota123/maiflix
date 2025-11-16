const Setting = require('../models/Setting');

// @desc    Get a setting by key or all settings
// @route   GET /api/settings
// @access  Private
exports.getSettings = async (req, res, next) => {
  try {
    const settings = await Setting.find();
    // Convert array of {key, value} to a single object {key1: value1, key2: value2}
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    res.status(200).json(settingsMap);
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update a setting
// @route   POST /api/settings
// @access  Private/Admin
exports.upsertSetting = async (req, res, next) => {
  const { key, value } = req.body;
  if (!key || value === undefined) {
    return res.status(400).json({ message: 'Chave (key) e valor (value) são obrigatórios.' });
  }
  try {
    const setting = await Setting.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(200).json(setting);
  } catch (error) {
    next(error);
  }
};
