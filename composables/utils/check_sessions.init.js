async function checkSession(user_id, ip) {
    try {
        let session = await prisma.sessions.findFirst({
            where: { user_id, ip },
        });
        return session;
    } catch (error) {
        return ({ message: "Unexpected error" ,error:error.message});
    }
}

module.exports = checkSession