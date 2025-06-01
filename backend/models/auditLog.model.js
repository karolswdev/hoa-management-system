'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      AuditLog.belongsTo(models.User, {
        foreignKey: 'admin_id',
        as: 'adminUser', // Alias for the admin user who performed the action
        onDelete: 'SET NULL', // If admin user is deleted, keep the log but set admin_id to null
      });
    }
  }
  AuditLog.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Can be null if admin user is deleted
      references: {
        model: 'users',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    details: {
      type: DataTypes.TEXT // Can store JSON string or plain text
    }
  }, {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false // Audit logs are typically immutable after creation
  });
  return AuditLog;
};