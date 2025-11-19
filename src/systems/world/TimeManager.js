/**
 * TimeManager - Manages game time, weather, and seasons
 *
 * Features:
 * - Day/night cycle
 * - Seasonal changes
 * - Dynamic weather
 * - Time-based events
 */

export class TimeManager {
  /**
   * Create time manager
   * @param {Object} options - Configuration
   */
  constructor(options = {}) {
    // Time tracking (in-game minutes)
    this.totalMinutes = options.totalMinutes || 0; // Total elapsed time
    this.minutesPerTurn = options.minutesPerTurn || 10; // Real-time advance per turn

    // Time constants
    this.MINUTES_PER_HOUR = 60;
    this.HOURS_PER_DAY = 24;
    this.DAYS_PER_MONTH = 30;
    this.MONTHS_PER_YEAR = 12;
    this.DAYS_PER_SEASON = 90; // 3 months per season

    // Current weather
    this.weather = options.weather || 'clear';
    this.weatherDuration = options.weatherDuration || 0; // Minutes until weather changes

    // Weather system
    this.weatherEnabled = options.weatherEnabled !== undefined ? options.weatherEnabled : true;
    this.weatherChangeFrequency = options.weatherChangeFrequency || 180; // Minutes between weather changes

    // Season
    this.currentSeason = this._calculateSeason();
  }

  /**
   * Advance time by a number of turns
   * @param {number} turns - Number of turns
   * @returns {Object} Time events that occurred
   */
  advanceTime(turns = 1) {
    const events = {
      dayChanged: false,
      monthChanged: false,
      yearChanged: false,
      seasonChanged: false,
      weatherChanged: false,
      timeOfDayChanged: false,
      oldDay: this.getDay(),
      oldMonth: this.getMonth(),
      oldYear: this.getYear(),
      oldSeason: this.currentSeason,
      oldWeather: this.weather,
      oldTimeOfDay: this.getTimeOfDay()
    };

    const minutesToAdd = turns * this.minutesPerTurn;
    this.totalMinutes += minutesToAdd;

    // Check for time changes
    events.dayChanged = this.getDay() !== events.oldDay;
    events.monthChanged = this.getMonth() !== events.oldMonth;
    events.yearChanged = this.getYear() !== events.oldYear;

    const newSeason = this._calculateSeason();
    events.seasonChanged = newSeason !== events.oldSeason;
    this.currentSeason = newSeason;

    events.timeOfDayChanged = this.getTimeOfDay() !== events.oldTimeOfDay;

    // Weather system
    if (this.weatherEnabled) {
      this.weatherDuration -= minutesToAdd;
      if (this.weatherDuration <= 0) {
        this.weather = this._generateWeather();
        this.weatherDuration = this.weatherChangeFrequency;
        events.weatherChanged = true;
      }
    }

    events.newDay = this.getDay();
    events.newMonth = this.getMonth();
    events.newYear = this.getYear();
    events.newSeason = this.currentSeason;
    events.newWeather = this.weather;
    events.newTimeOfDay = this.getTimeOfDay();

    return events;
  }

  /**
   * Get current hour (0-23)
   * @returns {number}
   */
  getHour() {
    const totalHours = Math.floor(this.totalMinutes / this.MINUTES_PER_HOUR);
    return totalHours % this.HOURS_PER_DAY;
  }

  /**
   * Get current minute (0-59)
   * @returns {number}
   */
  getMinute() {
    return this.totalMinutes % this.MINUTES_PER_HOUR;
  }

  /**
   * Get current day (1-30)
   * @returns {number}
   */
  getDay() {
    const totalDays = Math.floor(this.totalMinutes / (this.MINUTES_PER_HOUR * this.HOURS_PER_DAY));
    return (totalDays % this.DAYS_PER_MONTH) + 1;
  }

  /**
   * Get current month (1-12)
   * @returns {number}
   */
  getMonth() {
    const totalDays = Math.floor(this.totalMinutes / (this.MINUTES_PER_HOUR * this.HOURS_PER_DAY));
    const totalMonths = Math.floor(totalDays / this.DAYS_PER_MONTH);
    return (totalMonths % this.MONTHS_PER_YEAR) + 1;
  }

  /**
   * Get current year
   * @returns {number}
   */
  getYear() {
    const totalDays = Math.floor(this.totalMinutes / (this.MINUTES_PER_HOUR * this.HOURS_PER_DAY));
    const totalMonths = Math.floor(totalDays / this.DAYS_PER_MONTH);
    return Math.floor(totalMonths / this.MONTHS_PER_YEAR) + 1; // Year 1+
  }

  /**
   * Get time of day
   * @returns {string} 'dawn', 'morning', 'noon', 'afternoon', 'dusk', 'evening', 'night', 'midnight'
   */
  getTimeOfDay() {
    const hour = this.getHour();

    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 13) return 'noon';
    if (hour >= 13 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 19) return 'dusk';
    if (hour >= 19 && hour < 22) return 'evening';
    if (hour >= 22 || hour < 1) return 'night';
    return 'midnight';
  }

  /**
   * Check if it's daytime
   * @returns {boolean}
   */
  isDaytime() {
    const hour = this.getHour();
    return hour >= 6 && hour < 18;
  }

  /**
   * Check if it's nighttime
   * @returns {boolean}
   */
  isNighttime() {
    return !this.isDaytime();
  }

  /**
   * Get current season
   * @returns {string} 'spring', 'summer', 'autumn', 'winter'
   */
  getSeason() {
    return this.currentSeason;
  }

  /**
   * Calculate season from current date
   * @returns {string}
   * @private
   */
  _calculateSeason() {
    const totalDays = Math.floor(this.totalMinutes / (this.MINUTES_PER_HOUR * this.HOURS_PER_DAY));
    const dayOfYear = totalDays % (this.DAYS_PER_MONTH * this.MONTHS_PER_YEAR);

    if (dayOfYear < this.DAYS_PER_SEASON) return 'spring';
    if (dayOfYear < this.DAYS_PER_SEASON * 2) return 'summer';
    if (dayOfYear < this.DAYS_PER_SEASON * 3) return 'autumn';
    return 'winter';
  }

  /**
   * Get current weather
   * @returns {string}
   */
  getWeather() {
    return this.weather;
  }

  /**
   * Set weather manually
   * @param {string} weather
   * @param {number} duration - Minutes
   */
  setWeather(weather, duration = null) {
    this.weather = weather;
    this.weatherDuration = duration !== null ? duration : this.weatherChangeFrequency;
  }

  /**
   * Generate random weather based on season
   * @returns {string}
   * @private
   */
  _generateWeather() {
    const seasonWeather = {
      'spring': ['clear', 'clear', 'cloudy', 'rainy', 'windy'],
      'summer': ['clear', 'clear', 'clear', 'sunny', 'cloudy', 'stormy'],
      'autumn': ['clear', 'cloudy', 'cloudy', 'rainy', 'foggy', 'windy'],
      'winter': ['clear', 'cloudy', 'snowy', 'snowy', 'foggy', 'blizzard']
    };

    const options = seasonWeather[this.currentSeason] || ['clear'];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Get formatted time string
   * @returns {string}
   */
  getTimeString() {
    const hour = this.getHour();
    const minute = this.getMinute();
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  }

  /**
   * Get formatted date string
   * @returns {string}
   */
  getDateString() {
    const monthNames = [
      'Firstmoon', 'Secondmoon', 'Thirdmoon', 'Fourthmoon',
      'Fifthmoon', 'Sixthmoon', 'Seventhmoon', 'Eighthmoon',
      'Ninthmoon', 'Tenthmoon', 'Eleventhmoon', 'Twelfthmoon'
    ];

    const day = this.getDay();
    const month = monthNames[this.getMonth() - 1];
    const year = this.getYear();

    return `${day} ${month}, Year ${year}`;
  }

  /**
   * Get full time description
   * @returns {string}
   */
  getFullTimeDescription() {
    const time = this.getTimeString();
    const date = this.getDateString();
    const timeOfDay = this.getTimeOfDay();
    const season = this.currentSeason;
    const weather = this.weather;

    return `${time} - ${date} (${timeOfDay}, ${season}, ${weather})`;
  }

  /**
   * Get weather effect modifiers
   * @returns {Object} Combat and gameplay modifiers
   */
  getWeatherEffects() {
    const effects = {
      visibility: 1.0,
      accuracyModifier: 1.0,
      movementCost: 1.0,
      coldDamage: false,
      heatDamage: false,
      wetness: false
    };

    switch (this.weather) {
      case 'foggy':
        effects.visibility = 0.5;
        effects.accuracyModifier = 0.8;
        break;
      case 'rainy':
      case 'stormy':
        effects.visibility = 0.7;
        effects.accuracyModifier = 0.9;
        effects.wetness = true;
        break;
      case 'snowy':
        effects.visibility = 0.6;
        effects.movementCost = 1.5;
        effects.coldDamage = true;
        break;
      case 'blizzard':
        effects.visibility = 0.3;
        effects.accuracyModifier = 0.7;
        effects.movementCost = 2.0;
        effects.coldDamage = true;
        break;
      case 'sunny':
        effects.heatDamage = true;
        break;
    }

    return effects;
  }

  /**
   * Get time summary
   * @returns {Object}
   */
  getSummary() {
    return {
      totalMinutes: this.totalMinutes,
      time: this.getTimeString(),
      date: this.getDateString(),
      hour: this.getHour(),
      day: this.getDay(),
      month: this.getMonth(),
      year: this.getYear(),
      timeOfDay: this.getTimeOfDay(),
      isDaytime: this.isDaytime(),
      season: this.currentSeason,
      weather: this.weather,
      weatherDuration: this.weatherDuration,
      weatherEffects: this.getWeatherEffects()
    };
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      totalMinutes: this.totalMinutes,
      minutesPerTurn: this.minutesPerTurn,
      weather: this.weather,
      weatherDuration: this.weatherDuration,
      weatherEnabled: this.weatherEnabled,
      weatherChangeFrequency: this.weatherChangeFrequency
    };
  }

  /**
   * Deserialize from JSON
   * @param {Object} data
   * @returns {TimeManager}
   */
  static fromJSON(data) {
    return new TimeManager(data);
  }
}

export default TimeManager;
