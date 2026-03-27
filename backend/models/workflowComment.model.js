'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class WorkflowComment extends Model {
    static associate(models) {
      WorkflowComment.belongsTo(models.WorkflowInstance, {
        foreignKey: 'workflow_id',
        as: 'workflow'
      });
      WorkflowComment.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'author'
      });
    }
  }
  WorkflowComment.init({
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    is_internal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'WorkflowComment',
    tableName: 'workflow_comments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return WorkflowComment;
};
