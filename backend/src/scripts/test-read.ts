import { prisma } from "../lib/prisma.js";

const template = await prisma.template.findUnique({
  where: {
    id: "9498d22d-6d50-4367-842e-9b37e852abd2",
  },
  include: {
    sections: {
      include: {
        subsections: {
          include: {
            fields: true,
          },
        },
      },
    },
  },
});

console.log("Template:", template?.name);
console.log("Sections:", template?.sections.length);

const subsectionCount =
  template?.sections.reduce(
    (total, section) => total + section.subsections.length,
    0,
  ) ?? 0;

const fieldCount =
  template?.sections.reduce(
    (total, section) =>
      total +
      section.subsections.reduce(
        (subTotal, subsection) => subTotal + subsection.fields.length,
        0,
      ),
    0,
  ) ?? 0;

console.log("Subsections:", subsectionCount);
console.log("Fields:", fieldCount);

await prisma.$disconnect();
