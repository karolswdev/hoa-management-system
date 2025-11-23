'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ResidentNotificationLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ResidentNotificationLog.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      ResidentNotificationLog.belongsTo(models.EmailAudit, {
        foreignKey: 'email_audit_id',
        as: 'emailAudit'
      });
    }
  }
  ResidentNotificationLog.init({
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
    email_audit_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending'
    }
  }, {
    sequelize,
    modelName: 'ResidentNotificationLog',
    tableName: 'resident_notification_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return ResidentNotificationLog;
};
