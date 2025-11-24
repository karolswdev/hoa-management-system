'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BoardMember extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      BoardMember.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      BoardMember.belongsTo(models.BoardTitle, {
        foreignKey: 'title_id',
        as: 'title'
      });
    }
  }
  BoardMember.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    title_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'BoardMember',
    tableName: 'board_members',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return BoardMember;
};
