'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PollOption extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      PollOption.belongsTo(models.Poll, {
        foreignKey: 'poll_id',
        as: 'poll'
      });
      PollOption.hasMany(models.Vote, {
        foreignKey: 'option_id',
        as: 'votes'
      });
    }
  }
  PollOption.init({
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
    text: {
      type: DataTypes.STRING,
      allowNull: false
    },
    order_index: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'PollOption',
    tableName: 'poll_options',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return PollOption;
};
