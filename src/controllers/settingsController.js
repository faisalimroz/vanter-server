import SiteSettings from '../models/SiteSettings.js';

export const getSettings = async (req, res, next) => {
  try {
    const settings = await SiteSettings.getSingleton();
    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const {
      freeDeliveryThreshold,
      insideDhakaCharge,
      outsideDhakaCharge,
      freeDeliveryMessage
    } = req.body;

    const settings = await SiteSettings.getSingleton();

    if (freeDeliveryThreshold !== undefined) {
      settings.freeDeliveryThreshold = Number(freeDeliveryThreshold) || 0;
    }
    if (insideDhakaCharge !== undefined) {
      settings.insideDhakaCharge = Math.max(0, Number(insideDhakaCharge) || 0);
    }
    if (outsideDhakaCharge !== undefined) {
      settings.outsideDhakaCharge = Math.max(0, Number(outsideDhakaCharge) || 0);
    }
    if (freeDeliveryMessage !== undefined) {
      settings.freeDeliveryMessage = String(freeDeliveryMessage).trim();
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Site settings updated successfully',
      settings
    });
  } catch (error) {
    next(error);
  }
};
