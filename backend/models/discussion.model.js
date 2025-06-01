'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Discussion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Discussion.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'author',
        onDelete: 'SET NULL', // If user is deleted, discussion's author is set to null
      });
      Discussion.belongsTo(models.Discussion, {
        foreignKey: 'parent_id',
        as: 'parentThread',
        onDelete: 'CASCADE', // If parent thread is deleted, replies are also deleted
      });
      Discussion.hasMany(models.Discussion, {
        foreignKey: 'parent_id',
        as: 'replies',
      });
      Discussion.belongsTo(models.Document, {
        foreignKey: 'document_id',
        as: 'relatedDocument',
        onDelete: 'SET NULL', // If document is deleted, link is removed
      });
    }
  }
  Discussion.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true // Nullable for replies
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Null for main threads
      references: {
        model: 'discussions', // Self-reference
        key: 'id'
      }
    },
    document_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Null if not linked to a document
      references: {
        model: 'documents',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Discussion',
    tableName: 'discussions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at' // Or false if not needed
  });
  return Discussion;
};