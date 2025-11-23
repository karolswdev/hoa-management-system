'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EmailAudit extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // associations can be defined here if needed
    }
  }
  EmailAudit.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    template: {
      type: DataTypes.STRING,
      allowNull: false
    },
    recipient_count: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    request_payload_hash: {
      type: DataTypes.STRING,
      allowNull: true
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
    modelName: 'EmailAudit',
    tableName: 'email_audits',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return EmailAudit;
};
