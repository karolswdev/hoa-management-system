'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // --- Seed the Architectural Review Committee ---
    const existingCommittee = await queryInterface.rawSelect('committees', {
      where: { name: 'Architectural Review' }
    }, ['id']);

    let committeeId;
    if (!existingCommittee) {
      await queryInterface.bulkInsert('committees', [{
        name: 'Architectural Review',
        description: 'Reviews and approves or denies requests for exterior property modifications to ensure compliance with community standards.',
        status: 'active',
        approval_expiration_days: 365,
        created_at: now,
        updated_at: now
      }], {});

      committeeId = await queryInterface.rawSelect('committees', {
        where: { name: 'Architectural Review' }
      }, ['id']);
    } else {
      committeeId = existingCommittee;
      console.log('Committee "Architectural Review" already exists. Skipping.');
    }

    // --- Seed the config entry for default ARC committee ---
    const existingConfig = await queryInterface.rawSelect('config', {
      where: { key: 'arc_default_committee_id' }
    }, ['key']);

    if (!existingConfig) {
      await queryInterface.bulkInsert('config', [{
        key: 'arc_default_committee_id',
        value: String(committeeId)
      }], {});
    } else {
      console.log('Config "arc_default_committee_id" already exists. Skipping.');
    }

    // --- Seed ARC Categories ---
    const categories = [
      { name: 'Fence', description: 'Installation or modification of fencing', sort_order: 1 },
      { name: 'Paint/Exterior Color', description: 'Changes to exterior paint or color scheme', sort_order: 2 },
      { name: 'Landscaping', description: 'Significant landscaping modifications', sort_order: 3 },
      { name: 'Roofing', description: 'Roof replacement or repair', sort_order: 4 },
      { name: 'Deck/Patio', description: 'Construction or modification of decks and patios', sort_order: 5 },
      { name: 'Shed/Outbuilding', description: 'Installation of sheds, outbuildings, or storage structures', sort_order: 6 },
      { name: 'Solar Panels', description: 'Installation of solar panels or related equipment', sort_order: 7 },
      { name: 'Signage', description: 'Installation of signs or displays visible from the street', sort_order: 8 },
      { name: 'Other', description: 'Modifications not covered by other categories', sort_order: 99 }
    ];

    for (const cat of categories) {
      const existing = await queryInterface.rawSelect('arc_categories', {
        where: { name: cat.name }
      }, ['id']);

      if (!existing) {
        await queryInterface.bulkInsert('arc_categories', [{
          ...cat,
          is_active: true,
          created_at: now,
          updated_at: now
        }], {});
      } else {
        console.log(`ARC category "${cat.name}" already exists. Skipping.`);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove config entry
    await queryInterface.bulkDelete('config', {
      key: 'arc_default_committee_id'
    }, {});

    // Remove categories
    const categoryNames = [
      'Fence', 'Paint/Exterior Color', 'Landscaping', 'Roofing',
      'Deck/Patio', 'Shed/Outbuilding', 'Solar Panels', 'Signage', 'Other'
    ];
    await queryInterface.bulkDelete('arc_categories', {
      name: { [Sequelize.Op.in]: categoryNames }
    }, {});

    // Remove committee
    await queryInterface.bulkDelete('committees', {
      name: 'Architectural Review'
    }, {});
  }
};
