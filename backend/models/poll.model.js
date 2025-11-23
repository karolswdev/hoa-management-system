'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Poll extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Poll.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });
      Poll.hasMany(models.PollOption, {
        foreignKey: 'poll_id',
        as: 'options'
      });
      Poll.hasMany(models.Vote, {
        foreignKey: 'poll_id',
        as: 'votes'
      });
    }
  }
  Poll.init({
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
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    is_anonymous: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    notify_members: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    start_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Poll',
    tableName: 'polls',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Poll;
};
