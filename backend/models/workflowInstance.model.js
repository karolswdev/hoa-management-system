'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class WorkflowInstance extends Model {
    static associate(models) {
      WorkflowInstance.belongsTo(models.Committee, {
        foreignKey: 'committee_id',
        as: 'committee'
      });
      WorkflowInstance.belongsTo(models.User, {
        foreignKey: 'submitted_by',
        as: 'submitter'
      });
      WorkflowInstance.hasMany(models.WorkflowTransition, {
        foreignKey: 'workflow_id',
        as: 'transitions'
      });
      WorkflowInstance.hasMany(models.WorkflowComment, {
        foreignKey: 'workflow_id',
        as: 'comments'
      });
      WorkflowInstance.hasMany(models.WorkflowAttachment, {
        foreignKey: 'workflow_id',
        as: 'attachments'
      });
    }
  }
  WorkflowInstance.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    committee_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    request_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    request_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'draft',
      validate: {
        isIn: [['draft', 'submitted', 'under_review', 'approved', 'denied', 'withdrawn', 'appealed', 'appeal_under_review', 'appeal_approved', 'appeal_denied', 'expired']]
      }
    },
    submitted_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    appeal_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'WorkflowInstance',
    tableName: 'workflow_instances',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return WorkflowInstance;
};
