const classifyDevice = (type) => {
    const val = type?.toLowerCase();

    if (!val) return 'DESKTOP';

    const mobileKeywords = [
        'mobile', 'android', 'iphone', 'ipad',
        'redmi', 'samsung', 'huawei', 'xiaomi', 'oppo', 'vivo'
    ];

    for (const keyword of mobileKeywords) {
        if (val.includes(keyword)) return 'MOBILE';
    }

    return 'DESKTOP';
};

module.exports = classifyDevice;
