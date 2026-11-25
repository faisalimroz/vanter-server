import PageSection from '../models/PageSection.js';
import { deleteLocalFile } from '../utils/fileStorage.js';

export const getPublicSections = async (req, res, next) => {
  try {
    const sections = await PageSection.find({ isActive: true }).sort({ displayOrder: 1 });
    
    // Convert array to a convenient key-indexed dictionary + sorted list
    const sectionMap = {};
    sections.forEach(s => {
      sectionMap[s.sectionKey] = s;
    });

    return res.status(200).json({
      success: true,
      sections,
      sectionMap
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminSections = async (req, res, next) => {
  try {
    const sections = await PageSection.find().sort({ displayOrder: 1, createdAt: 1 });
    return res.status(200).json({
      success: true,
      sections
    });
  } catch (error) {
    next(error);
  }
};

export const getSectionByKey = async (req, res, next) => {
  try {
    const { sectionKey } = req.params;
    const section = await PageSection.findOne({ sectionKey });
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }
    return res.status(200).json({ success: true, section });
  } catch (error) {
    next(error);
  }
};

export const updateSectionByKey = async (req, res, next) => {
  try {
    const { sectionKey } = req.params;
    const updateData = req.body;

    let section = await PageSection.findOne({ sectionKey });
    if (!section) {
      // If not existing, create it
      section = new PageSection({
        sectionKey,
        sectionName: updateData.sectionName || sectionKey,
        ...updateData
      });
    } else {
      Object.assign(section, updateData);
    }

    await section.save();

    return res.status(200).json({
      success: true,
      message: `Section '${sectionKey}' updated successfully.`,
      section
    });
  } catch (error) {
    next(error);
  }
};

export const createSection = async (req, res, next) => {
  try {
    const { sectionKey, sectionName, ...rest } = req.body;
    if (!sectionKey || !sectionName) {
      return res.status(400).json({
        success: false,
        message: 'Section key and section display name are required.'
      });
    }

    const existing = await PageSection.findOne({ sectionKey });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Section with key '${sectionKey}' already exists.`
      });
    }

    const section = await PageSection.create({
      sectionKey,
      sectionName,
      ...rest
    });

    return res.status(201).json({
      success: true,
      message: 'Section created successfully.',
      section
    });
  } catch (error) {
    next(error);
  }
};

export const reorderSections = async (req, res, next) => {
  try {
    const { orderings } = req.body; // Array of { id, displayOrder }
    if (!Array.isArray(orderings)) {
      return res.status(400).json({ success: false, message: 'Orderings must be an array.' });
    }

    const bulkOps = orderings.map(item => ({
      updateOne: {
        filter: { _id: item.id },
        update: { displayOrder: Number(item.displayOrder) }
      }
    }));

    await PageSection.bulkWrite(bulkOps);

    return res.status(200).json({
      success: true,
      message: 'Section order updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const section = await PageSection.findById(id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }

    if (section.images && section.images.length > 0) {
      for (const img of section.images) {
        if (img.publicId || img.url) await deleteLocalFile(img.publicId || img.url);
      }
    }

    await PageSection.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Section deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
