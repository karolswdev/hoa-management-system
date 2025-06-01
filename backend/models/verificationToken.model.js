'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class VerificationToken extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      VerificationToken.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'CASCADE', // If a user is deleted, their tokens are also deleted
      });
    }
  }
  VerificationToken.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // Name of the target table
        key: 'id'
      }
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    type: {
      type: DataTypes.STRING, // e.g., 'email_verification', 'password_reset'
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'VerificationToken',
    tableName: 'verification_tokens',
    timestamps: true, // Enables createdAt and updatedAt
    createdAt: 'created_at', // Map createdAt to created_at
    updatedAt: false // No updatedAt for verification tokens
  });
  return VerificationToken;
};