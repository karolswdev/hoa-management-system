'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CalendarEntryException extends Model {
    static associate(models) {
      CalendarEntryException.belongsTo(models.CalendarEntry, {
        foreignKey: 'calendar_entry_id',
        as: 'calendarEntry',
        onDelete: 'CASCADE',
      });
      CalendarEntryException.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator',
        onDelete: 'SET NULL',
      });
    }
  }
  CalendarEntryException.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    calendar_entry_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'calendar_entries',
        key: 'id'
      }
    },
    exception_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    is_cancelled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    override_title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    override_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    override_time: {
      type: DataTypes.STRING(5),
      allowNull: true
    },
    note: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'CalendarEntryException',
    tableName: 'calendar_entry_exceptions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return CalendarEntryException;
};
