import { duplicateTemplate } from "./repositories/templateRepository.js";
import { prisma } from "../lib/prisma.js";

async function main() {
  const originalId = "9498d22d-6d50-4367-842e-9b37e852abd2";

  const copy = await duplicateTemplate(originalId);

  console.log("Original ID:", originalId);
  console.log("Copy ID:", copy.id);

  const copiedTemplate = await prisma.template.findUnique({
    where: {
      id: copy.id,
    },
    include: {
      sections: {
        include: {
          subsections: {
            include: {
              fields: {
                include: {
                  photos: true,
                },
              },
            },
          },
        },
      },
      issues: true,
    },
  });

  const subsectionCount =
    copiedTemplate?.sections.reduce(
      (total, section) => total + section.subsections.length,
      0,
    ) ?? 0;

  const fieldCount =
    copiedTemplate?.sections.reduce(
      (total, section) =>
        total +
        section.subsections.reduce(
          (subTotal, subsection) => subTotal + subsection.fields.length,
          0,
        ),
      0,
    ) ?? 0;

  const photoCount =
    copiedTemplate?.sections.reduce(
      (total, section) =>
        total +
        section.subsections.reduce(
          (subTotal, subsection) =>
            subTotal +
            subsection.fields.reduce(
              (fieldTotal, field) => fieldTotal + field.photos.length,
              0,
            ),
          0,
        ),
      0,
    ) ?? 0;

  console.log("Copy sections:", copiedTemplate?.sections.length);
  console.log("Copy subsections:", subsectionCount);
  console.log("Copy fields:", fieldCount);
  console.log("Copy photos:", photoCount);
  console.log("Copy issues:", copiedTemplate?.issues.length);

  const originalField = await prisma.field.findFirst({
    where: {
      subsection: {
        section: {
          templateId: originalId,
        },
      },
    },
  });

  const copiedField = await prisma.field.findFirst({
    where: {
      subsection: {
        section: {
          templateId: copy.id,
        },
      },
    },
  });

  if (!originalField || !copiedField) {
    throw new Error("Could not find fields for independence test");
  }

  console.log("Original field ID:", originalField.id);
  console.log("Copied field ID:", copiedField.id);

  await prisma.field.update({
    where: {
      id: copiedField.id,
    },
    data: {
      name: "INDEPENDENCE TEST",
    },
  });

  const originalAfterEdit = await prisma.field.findUnique({
    where: {
      id: originalField.id,
    },
  });

  const copiedAfterEdit = await prisma.field.findUnique({
    where: {
      id: copiedField.id,
    },
  });

  console.log("Original field after copy edit:", originalAfterEdit?.name);
  console.log("Copied field after copy edit:", copiedAfterEdit?.name);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
