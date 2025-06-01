'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Event, { foreignKey: 'created_by', as: 'events' });
      User.hasMany(models.Document, { foreignKey: 'uploaded_by', as: 'documents' });
      User.hasMany(models.Discussion, { foreignKey: 'created_by', as: 'discussions' });
      User.hasMany(models.Announcement, { foreignKey: 'created_by', as: 'announcements' });
      User.hasMany(models.AuditLog, { foreignKey: 'admin_id', as: 'auditLogs' });
      User.hasMany(models.VerificationToken, { foreignKey: 'user_id', as: 'verificationTokens' });
    }
  }
  User.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'member'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending'
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_system_user: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users', // Explicitly define table name
    timestamps: true, // Enables createdAt and updatedAt
    createdAt: 'created_at', // Map createdAt to created_at
    updatedAt: 'updated_at' // Map updatedAt to updated_at (if needed, or set to false)
  });
  return User;
};