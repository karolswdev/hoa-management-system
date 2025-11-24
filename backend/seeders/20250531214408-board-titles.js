'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Standard HOA board titles with rank ordering
    const titles = [
      { title: 'President', rank: 1 },
      { title: 'Vice President', rank: 2 },
      { title: 'Secretary', rank: 3 },
      { title: 'Treasurer', rank: 4 },
      { title: 'Board Member at Large', rank: 5 }
    ];

    const now = new Date();

    for (const titleData of titles) {
      const existingTitle = await queryInterface.rawSelect('board_titles', {
        where: { title: titleData.title },
      }, ['id']);

      if (!existingTitle) {
        await queryInterface.bulkInsert('board_titles', [
          {
            title: titleData.title,
            rank: titleData.rank,
            created_at: now,
            updated_at: now
          }
        ], {});
      } else {
        console.log(`Board title "${titleData.title}" already exists. Skipping title seed.`);
      }
    }
  },

  async down (queryInterface, Sequelize) {
    const titleNames = [
      'President',
      'Vice President',
      'Secretary',
      'Treasurer',
      'Board Member at Large'
    ];

    await queryInterface.bulkDelete('board_titles', {
      title: { [Sequelize.Op.in]: titleNames }
    }, {});
  }
};
