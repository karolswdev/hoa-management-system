'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Config extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Config.init({
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    value: {
      type: DataTypes.TEXT
    }
  }, {
    sequelize,
    modelName: 'Config',
    tableName: 'config',
    timestamps: false // No createdAt/updatedAt for config table as per original schema
  });
  return Config;
};