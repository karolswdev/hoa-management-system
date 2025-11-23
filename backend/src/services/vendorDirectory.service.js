const { Vendor, User } = require('../../models');
const { Op } = require('sequelize');
const configService = require('./config.service');
const auditService = require('./audit.service');
const { JSDOM } = require('jsdom');
const DOMPurify = require('dompurify');
const logger = require('../config/logger');

const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Cache for public categories config
let publicCategoriesCache = null;
let publicCategoriesCacheTime = null;
const CACHE_TTL_MS = 60000; // 60 seconds as per spec

/**
 * Get allowed public categories from config with TTL caching
 * @returns {Promise<Array<string>>} Array of category names visible to guests
 */
const getPublicCategories = async () => {
  const now = Date.now();

  if (publicCategoriesCache && publicCategoriesCacheTime && (now - publicCategoriesCacheTime < CACHE_TTL_MS)) {
    logger.debug('Using cached public categories', {
      cacheAge: now - publicCategoriesCacheTime,
      ttl: CACHE_TTL_MS
    });
    return publicCategoriesCache;
  }

  const configValue = await configService.getConfigValue('vendors.public-categories');
  const categories = configValue ? configValue.split(',').map(c => c.trim()) : [];

  publicCategoriesCache = categories;
  publicCategoriesCacheTime = now;

  logger.info('Refreshed public categories cache', {
    categories,
    ttl: CACHE_TTL_MS
  });

  return categories;
};

/**
 * Clear the public categories cache (called when config is updated)
 */
const clearPublicCategoriesCache = () => {
  publicCategoriesCache = null;
  publicCategoriesCacheTime = null;
  logger.info('Public categories cache cleared');
};

/**
 * Build visibility filter based on user role and authentication status
 * @param {boolean} isAuthenticated - Whether the requester is authenticated
 * @param {string} userRole - Role of the authenticated user (if any)
 * @returns {Promise<Object>} Sequelize where clause for visibility filtering
 */
const buildVisibilityFilter = async (isAuthenticated = false, userRole = null) => {
  const filter = {
    moderation_state: 'approved' // Only show approved vendors by default
  };

  if (userRole === 'admin') {
    // Admins see everything (including pending/denied for moderation)
    delete filter.moderation_state;
    return filter;
  }

  if (!isAuthenticated) {
    // Guests only see public categories
    const publicCategories = await getPublicCategories();
    if (publicCategories.length > 0) {
      filter.service_category = { [Op.in]: publicCategories };
      filter.visibility_scope = 'public';
    } else {
      // No public categories configured - return nothing for guests
      filter.id = { [Op.eq]: null }; // Matches nothing
    }
  } else {
    // Authenticated members see public + member-level vendors
    filter.visibility_scope = { [Op.in]: ['public', 'members'] };
  }

  return filter;
};

/**
 * Sanitize vendor DTO for external consumption based on user privileges
 * @param {Object} vendor - Raw vendor data
 * @param {boolean} isAuthenticated - Whether the requester is authenticated
 * @param {string} userRole - Role of the authenticated user
 * @returns {Object} Sanitized vendor DTO
 */
const sanitizeVendorDTO = (vendor, isAuthenticated = false, userRole = null) => {
  const dto = {
    id: vendor.id,
    name: vendor.name,
    service_category: vendor.service_category,
    visibility_scope: vendor.visibility_scope
  };

  // Admins see everything
  if (userRole === 'admin') {
    dto.contact_info = vendor.contact_info;
    dto.rating = vendor.rating;
    dto.notes = vendor.notes;
    dto.moderation_state = vendor.moderation_state;
    dto.created_by = vendor.created_by;
    dto.created_at = vendor.created_at;
    dto.updated_at = vendor.updated_at;
    return dto;
  }

  // Members see contact info and ratings
  if (isAuthenticated) {
    dto.contact_info = vendor.contact_info;
    dto.rating = vendor.rating;
  }

  // Guests only see name and category (already in dto)
  return dto;
};

/**
 * Get vendors with filtering and visibility enforcement
 * @param {Object} filters - Query filters (category, search, status for admins)
 * @param {boolean} isAuthenticated - Whether the requester is authenticated
 * @param {string} userRole - Role of the authenticated user
 * @returns {Promise<Array>} Array of vendor DTOs
 */
const getVendors = async (filters = {}, isAuthenticated = false, userRole = null) => {
  const whereClause = await buildVisibilityFilter(isAuthenticated, userRole);

  // Apply optional filters
  if (filters.category) {
    whereClause.service_category = filters.category;
  }

  if (filters.search) {
    whereClause.name = { [Op.like]: `%${filters.search}%` };
  }

  // Admin-only filter for moderation state
  if (filters.status && userRole === 'admin') {
    whereClause.moderation_state = filters.status;
  }

  const vendors = await Vendor.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }
    ],
    order: [
      ['service_category', 'ASC'],
      ['name', 'ASC']
    ]
  });

  logger.info('Vendors retrieved', {
    count: vendors.length,
    isAuthenticated,
    userRole,
    filters
  });

  return vendors.map(v => sanitizeVendorDTO(v.toJSON(), isAuthenticated, userRole));
};

/**
 * Get a single vendor by ID with visibility enforcement
 * @param {number} vendorId - Vendor ID
 * @param {boolean} isAuthenticated - Whether the requester is authenticated
 * @param {string} userRole - Role of the authenticated user
 * @returns {Promise<Object>} Vendor DTO
 */
const getVendorById = async (vendorId, isAuthenticated = false, userRole = null) => {
  const vendor = await Vendor.findByPk(vendorId, {
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }
    ]
  });

  if (!vendor) {
    throw new Error('Vendor not found');
  }

  // Check visibility permissions
  const visibilityFilter = await buildVisibilityFilter(isAuthenticated, userRole);

  // Admins can see everything
  if (userRole !== 'admin') {
    // Check moderation state
    if (vendor.moderation_state !== 'approved') {
      throw new Error('Vendor not found');
    }

    // Check visibility scope
    if (!isAuthenticated && vendor.visibility_scope !== 'public') {
      throw new Error('Vendor not found');
    }

    // Check category visibility for guests
    if (!isAuthenticated && vendor.visibility_scope === 'public') {
      const publicCategories = await getPublicCategories();
      if (!publicCategories.includes(vendor.service_category)) {
        throw new Error('Vendor not found');
      }
    }

    // Check member visibility
    if (isAuthenticated && !['public', 'members'].includes(vendor.visibility_scope)) {
      throw new Error('Vendor not found');
    }
  }

  return sanitizeVendorDTO(vendor.toJSON(), isAuthenticated, userRole);
};

/**
 * Create a new vendor (members can submit for moderation, admins can directly approve)
 * @param {Object} vendorData - Vendor data
 * @param {number} userId - ID of user creating the vendor
 * @param {string} userRole - Role of the user
 * @returns {Promise<Object>} Created vendor
 */
const createVendor = async (vendorData, userId, userRole = 'member') => {
  const { name, service_category, contact_info, rating, notes, visibility_scope } = vendorData;

  // Sanitize text fields
  const sanitizedName = purify.sanitize(name, { ALLOWED_TAGS: [] });
  const sanitizedCategory = purify.sanitize(service_category, { ALLOWED_TAGS: [] });
  const sanitizedContactInfo = contact_info ? purify.sanitize(contact_info, { ALLOWED_TAGS: [] }) : null;
  const sanitizedNotes = notes ? purify.sanitize(notes, { ALLOWED_TAGS: [] }) : null;

  // Validate required fields
  if (!sanitizedName || !sanitizedCategory) {
    throw new Error('Name and service category are required');
  }

  // Members submit for moderation, admins can directly approve
  const moderationState = userRole === 'admin' ? 'approved' : 'pending';
  const visibilityScope = visibility_scope || 'members';

  const vendor = await Vendor.create({
    name: sanitizedName,
    service_category: sanitizedCategory,
    contact_info: sanitizedContactInfo,
    rating: rating || null,
    notes: sanitizedNotes,
    visibility_scope: visibilityScope,
    moderation_state: moderationState,
    created_by: userId
  });

  logger.info('Vendor created', {
    vendorId: vendor.id,
    userId,
    userRole,
    moderationState
  });

  // Log admin action if admin created with approval
  if (userRole === 'admin') {
    try {
      await auditService.logAdminAction(userId, 'vendor_create', {
        vendorId: vendor.id,
        name: sanitizedName,
        category: sanitizedCategory,
        moderationState
      });
    } catch (auditError) {
      logger.error('Failed to log vendor creation audit', { error: auditError.message });
    }
  }

  return vendor.toJSON();
};

/**
 * Update a vendor (admin only)
 * @param {number} vendorId - Vendor ID
 * @param {Object} updates - Updates to apply
 * @param {number} adminUserId - Admin user ID
 * @returns {Promise<Object>} Updated vendor
 */
const updateVendor = async (vendorId, updates, adminUserId) => {
  const vendor = await Vendor.findByPk(vendorId);

  if (!vendor) {
    throw new Error('Vendor not found');
  }

  const allowedUpdates = [
    'name',
    'service_category',
    'contact_info',
    'rating',
    'notes',
    'visibility_scope',
    'moderation_state'
  ];

  const filteredUpdates = {};

  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      // Sanitize text fields
      if (['name', 'service_category', 'contact_info', 'notes'].includes(key) && updates[key]) {
        filteredUpdates[key] = purify.sanitize(updates[key], { ALLOWED_TAGS: [] });
      } else {
        filteredUpdates[key] = updates[key];
      }
    }
  });

  await vendor.update(filteredUpdates);

  logger.info('Vendor updated', {
    vendorId,
    adminUserId,
    updates: Object.keys(filteredUpdates)
  });

  // Log admin action
  try {
    await auditService.logAdminAction(adminUserId, 'vendor_update', {
      vendorId,
      updates: filteredUpdates
    });
  } catch (auditError) {
    logger.error('Failed to log vendor update audit', { error: auditError.message });
  }

  return vendor.toJSON();
};

/**
 * Delete a vendor (admin only)
 * @param {number} vendorId - Vendor ID
 * @param {number} adminUserId - Admin user ID
 * @returns {Promise<void>}
 */
const deleteVendor = async (vendorId, adminUserId) => {
  const vendor = await Vendor.findByPk(vendorId);

  if (!vendor) {
    throw new Error('Vendor not found');
  }

  const vendorData = vendor.toJSON();
  await vendor.destroy();

  logger.info('Vendor deleted', {
    vendorId,
    adminUserId
  });

  // Log admin action
  try {
    await auditService.logAdminAction(adminUserId, 'vendor_delete', {
      vendorId,
      name: vendorData.name,
      category: vendorData.service_category
    });
  } catch (auditError) {
    logger.error('Failed to log vendor deletion audit', { error: auditError.message });
  }
};

/**
 * Update vendor moderation state (admin only)
 * @param {number} vendorId - Vendor ID
 * @param {string} moderationState - New moderation state (pending, approved, denied)
 * @param {number} adminUserId - Admin user ID
 * @returns {Promise<Object>} Updated vendor
 */
const updateModerationState = async (vendorId, moderationState, adminUserId) => {
  if (!['pending', 'approved', 'denied'].includes(moderationState)) {
    throw new Error('Invalid moderation state. Must be: pending, approved, or denied');
  }

  const vendor = await Vendor.findByPk(vendorId);

  if (!vendor) {
    throw new Error('Vendor not found');
  }

  const oldState = vendor.moderation_state;
  await vendor.update({ moderation_state: moderationState });

  logger.info('Vendor moderation state updated', {
    vendorId,
    adminUserId,
    oldState,
    newState: moderationState
  });

  // Log admin action
  try {
    await auditService.logAdminAction(adminUserId, 'vendor_moderation', {
      vendorId,
      oldState,
      newState: moderationState,
      vendorName: vendor.name
    });
  } catch (auditError) {
    logger.error('Failed to log vendor moderation audit', { error: auditError.message });
  }

  return vendor.toJSON();
};

/**
 * Get vendor statistics (admin only)
 * @returns {Promise<Object>} Statistics about vendors
 */
const getVendorStats = async () => {
  const stats = await Vendor.findAll({
    attributes: [
      'moderation_state',
      [Vendor.sequelize.fn('COUNT', Vendor.sequelize.col('id')), 'count']
    ],
    group: ['moderation_state']
  });

  const categoryStats = await Vendor.findAll({
    where: { moderation_state: 'approved' },
    attributes: [
      'service_category',
      [Vendor.sequelize.fn('COUNT', Vendor.sequelize.col('id')), 'count']
    ],
    group: ['service_category'],
    order: [[Vendor.sequelize.fn('COUNT', Vendor.sequelize.col('id')), 'DESC']]
  });

  return {
    byModerationState: stats.map(s => ({
      state: s.moderation_state,
      count: parseInt(s.getDataValue('count'), 10)
    })),
    byCategory: categoryStats.map(s => ({
      category: s.service_category,
      count: parseInt(s.getDataValue('count'), 10)
    }))
  };
};

module.exports = {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  updateModerationState,
  getVendorStats,
  clearPublicCategoriesCache
};
