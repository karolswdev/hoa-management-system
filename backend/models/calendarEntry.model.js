'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CalendarEntry extends Model {
    static associate(models) {
      CalendarEntry.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator',
        onDelete: 'SET NULL',
      });
      CalendarEntry.hasMany(models.CalendarEntryException, {
        foreignKey: 'calendar_entry_id',
        as: 'exceptions',
        onDelete: 'CASCADE',
      });
    }
  }
  CalendarEntry.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: true
    },
    all_day: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    start_time: {
      type: DataTypes.STRING(5),
      allowNull: true
    },
    end_time: {
      type: DataTypes.STRING(5),
      allowNull: true
    },
    is_recurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    frequency: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    day_of_week: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    week_of_month: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    month_of_year: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    day_of_month: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    recurrence_end: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    seasonal_start: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    seasonal_end: {
      type: DataTypes.INTEGER,
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
    modelName: 'CalendarEntry',
    tableName: 'calendar_entries',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return CalendarEntry;
};
