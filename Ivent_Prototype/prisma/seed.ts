import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash("admin123", 10);
  const orgPass = await bcrypt.hash("organizer123", 10);
  const userPass = await bcrypt.hash("user123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: { email: "admin@demo.com", name: "Admin", passwordHash: adminPass, role: Role.ADMIN },
  });

  const organizer = await prisma.user.upsert({
    where: { email: "organizer@demo.com" },
    update: {},
    create: { email: "organizer@demo.com", name: "Organizer", passwordHash: orgPass, role: Role.ORGANIZER },
  });

  await prisma.user.upsert({
    where: { email: "user@demo.com" },
    update: {},
    create: { email: "user@demo.com", name: "User", passwordHash: userPass, role: Role.USER },
  });

  const now = new Date();
  const e1 = await prisma.event.create({
    data: {
      title: "Концерт у центрі міста",
      description: "Музичний вечір із живим виконанням.\n\nФормат: open-air, сімейний відпочинок, фудкорт.",
      city: "Житомир",
      location: "Міський парк",
      category: "Музика",
      startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 19, 0),
      endAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 22, 0),
      imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1600&q=80",
      organizerId: organizer.id,
      ticketTypes: {
        create: [
          { name: "Стандарт", price: 20000, quantityTotal: 200 },
          { name: "VIP", price: 50000, quantityTotal: 50 },
        ],
      },
    },
  });

  await prisma.event.create({
    data: {
      title: "Виставка сучасного мистецтва",
      description: "Експозиція робіт місцевих митців.\n\nВхід вільний для студентів за наявності студентського.",
      city: "Житомир",
      location: "Міська галерея",
      category: "Мистецтво",
      startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 12, 0),
      endAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 18, 0),
      imageUrl: "https://images.unsplash.com/photo-1520697222865-7b2488da2e09?auto=format&fit=crop&w=1600&q=80",
      organizerId: organizer.id,
      ticketTypes: { create: [{ name: "Вхідний квиток", price: 8000, quantityTotal: 300 }] },
    },
  });

  await prisma.review.create({
    data: {
      eventId: e1.id,
      userId: admin.id,
      rating: 5,
      text: "Класна подія, хороша організація та звук!",
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
