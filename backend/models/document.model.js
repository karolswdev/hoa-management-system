'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Document extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Document.belongsTo(models.User, {
        foreignKey: 'uploaded_by',
        as: 'uploader',
        onDelete: 'SET NULL', // If user is deleted, document's uploader is set to null
      });
      // If discussions can be linked to documents
      Document.hasMany(models.Discussion, {
        foreignKey: 'document_id',
        as: 'relatedDiscussions'
      });
    }
  }
  Document.init({
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
    description: {
      type: DataTypes.TEXT
    },
    file_name: { // Stored unique name
      type: DataTypes.STRING,
      allowNull: false
    },
    file_path: { // Server path
      type: DataTypes.STRING,
      allowNull: false
    },
    original_file_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    uploaded_by: {
      type: DataTypes.INTEGER,
      allowNull: true, // Can be null if uploader user is deleted
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Document',
    tableName: 'documents',
    timestamps: true,
    createdAt: 'uploaded_at', // Map createdAt to uploaded_at
    updatedAt: 'updated_at' // Or false if not needed
  });
  return Document;
};