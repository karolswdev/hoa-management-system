'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ArcRequest extends Model {
    static associate(models) {
      ArcRequest.belongsTo(models.User, {
        foreignKey: 'submitter_id',
        as: 'submitter'
      });
      ArcRequest.belongsTo(models.ArcCategory, {
        foreignKey: 'category_id',
        as: 'category'
      });
    }
  }
  ArcRequest.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    submitter_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    property_address: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'ArcRequest',
    tableName: 'arc_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return ArcRequest;
};
