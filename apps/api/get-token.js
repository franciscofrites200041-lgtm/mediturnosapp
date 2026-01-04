
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        orderBy: { createdAt: 'desc' },
    });

    if (user) {
        console.log('USUARIO ENCONTRADO:', user.email);
        console.log('TOKEN:', user.emailVerifyToken);
        console.log('LINK:', `http://localhost:3000/auth/verify-email?token=${user.emailVerifyToken}`);
    } else {
        console.log('No se encontraron usuarios');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
