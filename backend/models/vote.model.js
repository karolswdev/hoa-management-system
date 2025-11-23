'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Vote extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Vote.belongsTo(models.Poll, {
        foreignKey: 'poll_id',
        as: 'poll'
      });
      Vote.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      Vote.belongsTo(models.PollOption, {
        foreignKey: 'option_id',
        as: 'option'
      });
    }
  }
  Vote.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    poll_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    option_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    prev_hash: {
      type: DataTypes.STRING,
      allowNull: true
    },
    vote_hash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    receipt_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  }, {
    sequelize,
    modelName: 'Vote',
    tableName: 'votes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Vote;
};
