import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_USER_EMAIL ?? "jij@example.com").toLowerCase();
  const password = process.env.SEED_USER_PASSWORD ?? "changeme";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name: "Eigenaar" },
  });

  const count = await prisma.item.count({ where: { userId: user.id } });
  if (count === 0) {
    await prisma.item.create({
      data: {
        userId: user.id,
        categorie: "LOCOMOTIEF",
        merk: "Märklin",
        artikelnummer: "39463",
        typeAanduiding: "Re 460",
        maatschappij: "SBB",
        schaal: "H0",
        tijdperk: "V",
        loc: { create: { loknummer: "460 044-1", kopstaart: "Affoltern am Albis" } },
      },
    });
    await prisma.item.create({
      data: {
        userId: user.id,
        categorie: "PERSONENRIJTUIG",
        merk: "Roco",
        artikelnummer: "74531",
        typeAanduiding: "EW IV B",
        maatschappij: "SBB",
        schaal: "H0",
        tijdperk: "V",
        aantal: 1,
        personen: {
          create: { soort: "zitrijtuig", wagennummer: "61 85 20-90 235-3" },
        },
      },
    });
  }

  console.log(`Seed klaar — login: ${email} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
