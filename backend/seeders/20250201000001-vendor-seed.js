'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Baseline vendor categories with sample entries
    const vendors = [
      {
        name: 'GreenScape Landscaping',
        service_category: 'Landscaping',
        contact_info: 'Phone: (555) 123-4567\nEmail: contact@greenscape.example\nWebsite: www.greenscape.example',
        rating: 4,
        notes: 'Reliable landscaping service, responsive to seasonal needs',
        visibility_scope: 'public',
        moderation_state: 'approved'
      },
      {
        name: 'SecureWatch Security',
        service_category: 'Security',
        contact_info: 'Phone: (555) 234-5678\nEmail: info@securewatch.example\n24/7 Emergency: (555) 234-9999',
        rating: 5,
        notes: 'Premium security provider with excellent response time',
        visibility_scope: 'members',
        moderation_state: 'approved'
      },
      {
        name: 'AquaPro Pool Service',
        service_category: 'Pool Maintenance',
        contact_info: 'Phone: (555) 345-6789\nEmail: service@aquapro.example',
        rating: 4,
        notes: 'Weekly maintenance, chemical balancing, equipment repair',
        visibility_scope: 'members',
        moderation_state: 'approved'
      },
      {
        name: 'HandyFix Repairs',
        service_category: 'General Maintenance',
        contact_info: 'Phone: (555) 456-7890\nEmail: jobs@handyfix.example',
        rating: 3,
        notes: 'Good for small repairs, limited availability during peak season',
        visibility_scope: 'members',
        moderation_state: 'approved'
      },
      {
        name: 'Elite Roofing Solutions',
        service_category: 'Roofing',
        contact_info: 'Phone: (555) 567-8901\nEmail: quotes@eliteroofing.example',
        rating: null,
        notes: 'New vendor, awaiting community feedback',
        visibility_scope: 'members',
        moderation_state: 'approved'
      },
      {
        name: 'Budget Cleaners Inc',
        service_category: 'Cleaning',
        contact_info: 'Phone: (555) 678-9012',
        rating: null,
        notes: 'Pending verification of credentials',
        visibility_scope: 'admins',
        moderation_state: 'pending'
      }
    ];

    const now = new Date();

    // Insert vendors with idempotency check
    for (const vendorData of vendors) {
      const existingVendor = await queryInterface.rawSelect('vendors', {
        where: {
          name: vendorData.name,
          service_category: vendorData.service_category
        },
      }, ['id']);

      if (!existingVendor) {
        await queryInterface.bulkInsert('vendors', [
          {
            ...vendorData,
            created_at: now,
            updated_at: now
          }
        ], {});
      } else {
        console.log(`Vendor "${vendorData.name}" in category "${vendorData.service_category}" already exists. Skipping vendor seed.`);
      }
    }

    // Seed the config entry for public vendor categories
    const publicCategories = JSON.stringify([
      'Landscaping',
      'Security',
      'Pool Maintenance'
    ]);

    const existingConfig = await queryInterface.rawSelect('config', {
      where: { key: 'vendors.public-categories' }
    }, ['key']);

    if (!existingConfig) {
      await queryInterface.bulkInsert('config', [
        {
          key: 'vendors.public-categories',
          value: publicCategories
        }
      ], {});
    } else {
      console.log('Config entry "vendors.public-categories" already exists. Skipping config seed.');
    }
  },

  async down (queryInterface, Sequelize) {
    // Remove seeded vendors
    const vendorNames = [
      'GreenScape Landscaping',
      'SecureWatch Security',
      'AquaPro Pool Service',
      'HandyFix Repairs',
      'Elite Roofing Solutions',
      'Budget Cleaners Inc'
    ];

    await queryInterface.bulkDelete('vendors', {
      name: { [Sequelize.Op.in]: vendorNames }
    }, {});

    // Remove config entry
    await queryInterface.bulkDelete('config', {
      key: 'vendors.public-categories'
    }, {});
  }
};
