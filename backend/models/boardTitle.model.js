'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BoardTitle extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      BoardTitle.hasMany(models.BoardMember, {
        foreignKey: 'title_id',
        as: 'boardMembers'
      });
    }
  }
  BoardTitle.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    rank: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'BoardTitle',
    tableName: 'board_titles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return BoardTitle;
};
