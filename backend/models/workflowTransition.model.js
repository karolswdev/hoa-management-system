'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class WorkflowTransition extends Model {
    static associate(models) {
      WorkflowTransition.belongsTo(models.WorkflowInstance, {
        foreignKey: 'workflow_id',
        as: 'workflow'
      });
      WorkflowTransition.belongsTo(models.User, {
        foreignKey: 'performed_by',
        as: 'performer'
      });
    }
  }
  WorkflowTransition.init({
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
    from_status: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    to_status: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    performed_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'WorkflowTransition',
    tableName: 'workflow_transitions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return WorkflowTransition;
};
