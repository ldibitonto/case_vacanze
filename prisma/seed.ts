import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.property.createMany({
    data: [
      {
        name: "Casa Girasole",
        slug: "casa-girasole",
        description: "Casa indipendente con giardino, ideale per famiglie.",
        address: "Via delle Vigne 12, Druento (TO)",
        maxGuests: 6,
        basePrice: 120.0,
        currency: "EUR",
      },
      {
        name: "Baita Stella Alpina",
        slug: "baita-stella-alpina",
        description: "Baita di montagna con vista sulle Alpi.",
        address: "Frazione Alta, Valle di Susa (TO)",
        maxGuests: 4,
        basePrice: 95.0,
        currency: "EUR",
      },
      // Le 6 proprietà sotto alimentano la homepage con layout stile HomeToGo
      // (src/app/page.tsx + src/data/propertyExtras.ts). Gli slug devono
      // combaciare con le chiavi di propertyExtras per avere foto/amenità/rating.
      {
        name: "Casa con piscina privata, barbecue e terrazza | Vista sul mare",
        slug: "casa-piscina-sicilia",
        description: "Casa vacanza con piscina privata e terrazza vista mare.",
        address: "Sicilia",
        maxGuests: 7,
        basePrice: 112.0,
        currency: "EUR",
      },
      {
        name: "Bellissima casa con terrazza | Vista sul giardino | Accanto al mare",
        slug: "casa-terrazza-otranto",
        description: "Casa con terrazza e giardino a due passi dal mare.",
        address: "Otranto, Puglia",
        maxGuests: 4,
        basePrice: 70.0,
        currency: "EUR",
      },
      {
        name: "Spaziosa villa totalmente attrezzata con giardino e piscina",
        slug: "villa-maddalena-sardegna",
        description: "Villa attrezzata con giardino privato e piscina.",
        address: "La Maddalena, Sardegna",
        maxGuests: 5,
        basePrice: 148.0,
        currency: "EUR",
      },
      {
        name: "Casale in pietra tra le colline | Piscina panoramica",
        slug: "casale-toscana",
        description: "Casale in pietra con piscina panoramica tra le colline.",
        address: "Val d'Orcia, Toscana",
        maxGuests: 8,
        basePrice: 189.0,
        currency: "EUR",
      },
      {
        name: "Appartamento fronte lago con balcone privato",
        slug: "appartamento-como",
        description: "Appartamento fronte lago con balcone privato.",
        address: "Lago di Como, Lombardia",
        maxGuests: 3,
        basePrice: 96.0,
        currency: "EUR",
      },
      {
        name: "Trullo tipico ristrutturato con giardino privato",
        slug: "trullo-valle-itria",
        description: "Trullo tipico ristrutturato con giardino privato.",
        address: "Valle d'Itria, Puglia",
        maxGuests: 4,
        basePrice: 85.0,
        currency: "EUR",
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed completato.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
