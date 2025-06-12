const { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } = require("date-fns");

function getDateRange(path, query) {
    const now = new Date();

    if (path.endsWith("/day")) {
        return { gte: startOfDay(now), lt: endOfDay(now) };
    }

    if (path.endsWith("/month")) {
        return { gte: startOfMonth(now), lt: endOfMonth(now) };
    }

    if (path.endsWith("/year")) {
        return { gte: startOfYear(now), lt: endOfYear(now) };
    }

if (path.endsWith("/custom")) {
    const { date, month, year } = query;

    // Все параметры приходят как строки, надо привести к числу
    const d = date ? parseInt(date) : null;
    const m = month ? parseInt(month) : null;
    const y = year ? parseInt(year) : null;

    // Если есть date, month, year — вернуть конкретный день
    if (d && m && y) {
      const fullDate = new Date(y, m - 1, d);
      if (isNaN(fullDate.getTime())) return undefined;

      return {
        gte: startOfDay(fullDate),
        lt: endOfDay(fullDate)
      };
    }

    // Если есть только month и year — вернуть месяц
    if (m && y) {
      const monthDate = new Date(y, m - 1, 1);
      return {
        gte: startOfMonth(monthDate),
        lt: endOfMonth(monthDate)
      };
    }

    // Если только год
    if (y) {
      const yearDate = new Date(y, 0, 1);
      return {
        gte: startOfYear(yearDate),
        lt: endOfYear(yearDate)
      };
    }
  }

    return undefined;
}

module.exports = getDateRange;
