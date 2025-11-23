'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Vendor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Vendor created by User
      Vendor.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });
    }
  }
  Vendor.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Vendor business name'
    },
    service_category: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Category of service provided (e.g., Landscaping, Security, Pool Maintenance)'
    },
    contact_info: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Consolidated contact information including phone, email, address'
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      },
      comment: 'Internal rating (1-5 scale), managed by admins'
    },
    notes: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: 'Internal notes about vendor, service quality, or history'
    },
    visibility_scope: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'members',
      validate: {
        isIn: [['public', 'members', 'admins']]
      },
      comment: 'Visibility level: public (guests), members (authenticated), admins (privileged only)'
    },
    moderation_state: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'approved', 'denied']]
      },
      comment: 'Moderation status: pending (under review), approved (published), denied (rejected)'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User who created this vendor entry; NULL if created by system or user deleted'
    }
  }, {
    sequelize,
    modelName: 'Vendor',
    tableName: 'vendors',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Vendor;
};
