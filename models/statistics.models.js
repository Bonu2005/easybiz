
const prisma = require("../database/config.db")
const DeviceDetektor = require("device-detector-js");
const getDateRange = require('../composables/utils/statistics_date.helper');

class Statistic {
    constructor() {
        this.deviceDetector = new DeviceDetektor()
    }

    async browsers_statistics(req, res) {
        try {
            const range = getDateRange(req.path, req.query);
            const { deviceType } = req.query;
            const allowedTypes = ['MOBILE', 'DESKTOP'];
            if (deviceType && !allowedTypes.includes(deviceType.toUpperCase())) {
                return res.status(400).json({ message: "Invalid deviceType. Use 'MOBILE' or 'DESKTOP'" });
            }

            const baseWhere = {
                user: {
                    role: {
                        name: "USER"
                    }
                }
            };


            const whereClause = {
                ...baseWhere,
                ...(range ? { createdAt: range } : {}),
                ...(deviceType ? { deviceGroup: deviceType.toUpperCase() } : {})
            };
            console.log(whereClause);

            const allSessionsCount = await prisma.sessions.count({ where: whereClause });

            if (allSessionsCount === 0) {
                const fallbackWhere = {
                    user: {
                        role: {
                            name: "USER"
                        }
                    },
                    ...(deviceType ? { deviceGroup: deviceType.toUpperCase() } : {})
                };
                console.log(fallbackWhere);

                const fallbackBrowserStats = await prisma.sessions.groupBy({
                    by: ['browser'],
                    where: fallbackWhere,
                    _count: { browser: true },
                    orderBy: {
                        _count: {
                            browser: 'desc'
                        }
                    }

                });
                console.log(fallbackBrowserStats);

                const total = fallbackBrowserStats.reduce((acc, item) => acc + item._count.browser, 0);

                const fallbackResult = fallbackBrowserStats.map(item => ({
                    browser: item.browser,
                    count: item._count.browser,
                    percentage: Math.floor(((item._count.browser / total) * 100).toFixed(2)) + '%'
                }));

                return res.status(200).json({
                    message: "No data found in the given range. Returning recent stats for users with role USER.",
                    data: fallbackResult
                });
            }

            const browserStats = await prisma.sessions.groupBy({
                by: ['browser'],
                where: whereClause,
                _count: { browser: true }
            });

            const statsWithPercentages = browserStats.map(item => ({
                browser: item.browser,
                count: item._count.browser,
                percentage: Math.floor(((item._count.browser / allSessionsCount) * 100).toFixed(2)) + '%'
            }));

            res.status(200).json(statsWithPercentages);
        } catch (error) {
            console.error('Error Browser Statistic:', error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async devices_statistics(req, res) {
        try {
            const range = getDateRange(req.path, req.query);
            const { deviceType } = req.query;
            const allowedTypes = ['MOBILE', 'DESKTOP'];
            if (deviceType && !allowedTypes.includes(deviceType.toUpperCase())) {
                return res.status(400).json({ message: "Invalid deviceType. Use 'MOBILE' or 'DESKTOP'" });
            }

            const baseWhere = {
                user: {
                    role: {
                        name: "USER"
                    }
                }
            };


            const whereClause = {
                ...baseWhere,
                ...(range ? { createdAt: range } : {}),
                ...(deviceType ? { deviceGroup: deviceType.toUpperCase() } : {})
            };

            const allSessionsCount = await prisma.sessions.count({ where: whereClause });


            if (allSessionsCount === 0) {
                const fallbackWhere = {
                    ...baseWhere,
                    ...(deviceType ? { deviceGroup: deviceType.toUpperCase() } : {})
                };

                const fallbackStats = await prisma.sessions.groupBy({
                    by: ['deviceType'],
                    where: fallbackWhere,
                    _count: { deviceType: true },
                    orderBy: {
                        _count: {
                            deviceType: 'desc'
                        }
                    }
                });

                const total = fallbackStats.reduce((acc, item) => acc + item._count.deviceType, 0);

                const fallbackResult = fallbackStats.map(item => ({
                    deviceType: item.deviceType,
                    count: item._count.deviceType,
                    percentage: Math.floor(((item._count.deviceType / total) * 100).toFixed(2)) + '%'
                }));

                return res.status(200).json({
                    message: "No data found in the given range. Returning recent stats for users with role USER.",
                    data: fallbackResult
                });
            }


            const devicesStats = await prisma.sessions.groupBy({
                by: ['deviceType'],
                where: whereClause,
                _count: { deviceType: true }
            });

            const statsWithPercentages = devicesStats.map(item => ({
                deviceType: item.deviceType,
                count: item._count.deviceType,
                percentage: Math.floor(((item._count.deviceType / allSessionsCount) * 100).toFixed(2)) + '%'
            }));

            return res.status(200).json(statsWithPercentages);

        } catch (error) {
            console.error('Error Device Statistic:', error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async user_statistics(req, res) {
        try {
            const range = getDateRange(req.path, req.query);
            const { deviceType } = req.query;


            const allowedTypes = ['MOBILE', 'DESKTOP'];
            if (deviceType && !allowedTypes.includes(deviceType.toUpperCase())) {
                return res.status(400).json({ message: "Invalid deviceType. Use 'MOBILE' or 'DESKTOP'" });
            }

            const baseRoleFilter = {
                status: "ACTIVE",
                role: {
                    name: "USER"
                }
            };

            const where = {
                ...baseRoleFilter,
                ...(range ? { createdAt: range } : {}),
                ...(deviceType ? {
                    Sessions: {
                        some: {
                            deviceGroup: deviceType.toUpperCase()
                        }
                    }
                } : {})
            };

            const count = await prisma.users.count({ where });
            const total_page = Math.ceil(count / 20);


            if (count === 0) {
                const fallbackWhere = {
                    role: {
                        name: "USER"
                    },
                    ...(deviceType ? {
                        Sessions: {
                            some: {
                                deviceGroup: deviceType.toUpperCase()
                            }
                        }
                    } : {})
                };

                const recentUsers = await prisma.users.findMany({
                    where: fallbackWhere,
                    take: 20,
                    orderBy: {
                        createdAt: 'desc'
                    },
                    include: {
                        role: true
                    }
                });

                return res.status(200).json({
                    message: "No statistics found in given range. Returning recent users with role USER.",
                    data: {
                        total_count: 0,
                        total_page: 0,
                        recent_users: recentUsers
                    }
                });
            }

            return res.status(200).json({
                data: {
                    total_count: count,
                    total_page
                }
            });

        } catch (error) {
            console.error('Error User Statistics:', error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async page_statistics(req, res) {
        try {
            const range = getDateRange(req.path, req.query);

            const whereClause = range ? { createdAt: range } : {};


            const allPageNamesRaw = await prisma.viewPages.findMany({
                select: { name: true },
                distinct: ['name'],
            });

            const allPageNames = allPageNamesRaw.map(item => item.name);

            const pageStats = await prisma.viewPages.groupBy({
                by: ['name'],
                where: whereClause,
                _count: { name: true },
            });


            const result = allPageNames.map(name => {
                const stat = pageStats.find(p => p.name === name);
                return {
                    name,
                    count: stat?._count.name || 0
                };
            });

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error Page Statistic:', error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async average_session_time(req, res) {
        try {
            const dateFilter = getDateRange(req.path, req.query);
            const { deviceType } = req.query;

            const allowedTypes = ['MOBILE', 'DESKTOP'];
            if (deviceType && !allowedTypes.includes(deviceType.toUpperCase())) {
                return res.status(400).json({ message: "Invalid deviceType. Use 'MOBILE' or 'DESKTOP'" });
            }

            const baseFilter = {
                NOT: { endDate: null },
                user: {
                    role: {
                        name: 'USER'
                    }
                },
                ...(dateFilter ? { date: dateFilter } : {}),
                ...(deviceType ? { deviceGroup: deviceType.toUpperCase() } : {})
            };

            let sessions = await prisma.sessions.findMany({
                where: baseFilter,
                select: {
                    date: true,
                    endDate: true
                }
            });

            // fallback если не найдено
            if (sessions.length === 0) {
                const fallbackFilter = {
                    NOT: { endDate: null },
                    user: {
                        role: {
                            name: 'USER'
                        }
                    },
                    ...(deviceType ? { deviceGroup: deviceType.toUpperCase() } : {})
                };

                sessions = await prisma.sessions.findMany({
                    where: fallbackFilter,
                    orderBy: {
                        date: 'desc'
                    },
                    take: 20,
                    select: {
                        date: true,
                        endDate: true
                    }
                });

                if (sessions.length === 0) {
                    return res.status(404).json({ message: 'No completed sessions for users with role USER' });
                }
            }

            const totalMs = sessions.reduce((acc, session) => {
                return acc + (new Date(session.endDate).getTime() - new Date(session.date).getTime());
            }, 0);

            const avgMs = totalMs / sessions.length;
            const totalMinutes = Math.floor(avgMs / 60000);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;

            return res.json({
                averageSessionTime: `${hours}h ${minutes}m`,
                totalSessions: sessions.length,
                fallbackUsed: !!(dateFilter && sessions.length < 20)
            });

        } catch (error) {
            console.error('Error calculating average session time:', error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async end_time_session(req, res) {
        try {
            const { sessionId, endDate } = req.body;

            if (!sessionId || !endDate) {
                return res.status(400).json({ error: 'Missing sessionId or endDate' });
            }

            const session = await prisma.sessions.findUnique({ where: { id: sessionId } });
            if (!session) return res.status(404).json({ message: 'Session not found' });
            if (session.endDate) return res.status(400).json({ message: 'Session already ended' });

            const end = new Date(endDate);
            const start = new Date(session.date);

            if (end <= start) {
                return res.status(400).json({ message: 'End time must be after start time' });
            }

            const maxSessionDuration = 24 * 60 * 60 * 1000;
            if (end - start > maxSessionDuration) {
                return res.status(400).json({ message: 'Session duration too long' });
            }

            const updated = await prisma.sessions.update({
                where: { id: sessionId },
                data: { endDate: end }
            });

            return res.json({ message: 'Session ended', session: updated });

        } catch (error) {
            console.error('Error ending session:', error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async getLogs(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const skip = (page - 1) * limit;

            const [logs, totalLogs] = await Promise.all([
                prisma.requestLog.findMany({
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.requestLog.count(),
            ]);

            const totalPages = Math.ceil(totalLogs / limit);

            return res.status(200).json({
                success: true,
                data: logs,
                meta: {
                    totalLogs,
                    currentPage: page,
                    totalPages,
                    limitPerPage: limit,
                },
            });
        } catch (error) {
            console.error("Error fetching request logs:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to retrieve logs. Please try again later.",
            });
        }
    }

    async logPageView(req, res) {
        try {
            let { name } = req.body;

            if (!name || typeof name !== 'string') {
                return res.status(400).json({ message: 'Page name is required' });
            }

            name = name.trim().toUpperCase();

            await prisma.viewPages.create({
                data: { name },
            });

            return res.status(201).json({ message: 'Page view logged' });
        } catch (error) {
            console.error('Error logging page view:', error);
            return res.status(500).json({ message: 'Server error' });
        }

    }

    async get_admins(req, res) {
        try {
            let find_users_count = await prisma.users.count()
            let find_role = await prisma.role.findFirst({ where: { name: "ADMIN" } })
            console.log(find_role.id);

            let find_users = await prisma.users.findMany({ include: { role: true }, where: { roleId: find_role.id } })
            let total_page = Math.ceil(find_users_count / 20)
            return res.status(200).json({ data: find_users, total_count: find_users_count, total_page })
        } catch (error) {
            console.error("Get users error:", error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async get_users(req, res) {

        try {
            let find_users_count = await prisma.users.count()
            let find_role = await prisma.role.findFirst({ where: { name: "USER" } })
            console.log(find_role.id);

            let find_users = await prisma.users.findMany({ include: { role: true }, where: { roleId: find_role.id } })
            let total_page = Math.ceil(find_users_count / 20)
            return res.status(200).json({ data: find_users, total_count: find_users_count, total_page })
        } catch (error) {
            console.error("Get users error:", error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }


}
module.exports = new Statistic();