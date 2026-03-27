'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class WorkflowAttachment extends Model {
    static associate(models) {
      WorkflowAttachment.belongsTo(models.WorkflowInstance, {
        foreignKey: 'workflow_id',
        as: 'workflow'
      });
      WorkflowAttachment.belongsTo(models.User, {
        foreignKey: 'uploaded_by',
        as: 'uploader'
      });
    }
  }
  WorkflowAttachment.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    workflow_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    uploaded_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    original_file_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    file_path: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'WorkflowAttachment',
    tableName: 'workflow_attachments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return WorkflowAttachment;
};
