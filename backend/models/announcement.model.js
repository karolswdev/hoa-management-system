'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Announcement extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Announcement.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator',
        onDelete: 'SET NULL', // If user is deleted, announcement's creator is set to null
      });
    }
  }
  Announcement.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true, // Can be null if creator user is deleted
      references: {
        model: 'users',
        key: 'id'
      }
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Announcement',
    tableName: 'announcements',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at' // Or false if not needed
  });
  return Announcement;
};