'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Committee extends Model {
    static associate(models) {
      Committee.hasMany(models.CommitteeMember, {
        foreignKey: 'committee_id',
        as: 'members'
      });
      Committee.hasMany(models.WorkflowInstance, {
        foreignKey: 'committee_id',
        as: 'workflowInstances'
      });
    }
  }
  Committee.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'inactive']]
      }
    },
    approval_expiration_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 365
    }
  }, {
    sequelize,
    modelName: 'Committee',
    tableName: 'committees',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Committee;
};
