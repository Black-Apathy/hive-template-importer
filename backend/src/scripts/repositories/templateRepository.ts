import { randomUUID } from "node:crypto";

import { prisma } from "../../lib/prisma.js";
import type {
  ParsedField,
  ParsedTemplate,
} from "../../importer/types.js";

export async function createTemplate(template: ParsedTemplate) {
  return prisma.$transaction(
    async (tx) => {
      const templateId = randomUUID();

      await tx.template.create({
        data: {
          id: templateId,
          name: template.name,
          source: template.source,
        },
      });

      const sectionRows = template.sections.map((section) => ({
        id: randomUUID(),
        templateId,
        name: section.name,
        order: section.order,
      }));

      await tx.section.createMany({
        data: sectionRows,
      });

      const subsectionRows = template.sections.flatMap((section, sectionIndex) => {
        const sectionRow = sectionRows[sectionIndex];

        if (!sectionRow) {
          throw new Error("Section ID could not be resolved");
        }

        return section.subsections.map((subsection) => ({
          id: randomUUID(),
          sectionId: sectionRow.id,
          name: subsection.name,
          order: subsection.order,
        }));
      });

      await tx.subsection.createMany({
        data: subsectionRows,
      });

      const fieldRows: Array<{
        id: string;
        subsectionId: string;
        name: string;
        commentText: string | null;
        commentType: string;
        category: number | null;
        answerType: string | null;
        order: number;
        options: string | null;
        unitOptions: string | null;
        recommendation: string | null;
        defaultValue: string | null;
        defaultValue2: string | null;
        defaultUnitType: string | null;
        estimateMin: number | null;
        estimateMax: number | null;
        locked: boolean;
        simpleFormat: boolean;
        disablePhotos: boolean;
        uses: string | null;
      }> = [];

      const fieldMappings: Array<{
        fieldId: string;
        photos: ParsedField["photos"];
      }> = [];

      let subsectionIndex = 0;

      for (const section of template.sections) {
        for (const subsection of section.subsections) {
          const subsectionRow = subsectionRows[subsectionIndex];

          if (!subsectionRow) {
            throw new Error("Subsection ID could not be resolved");
          }

          for (const field of subsection.fields) {
            const fieldId = randomUUID();

            fieldRows.push({
              id: fieldId,
              subsectionId: subsectionRow.id,
              name: field.name,
              commentText: field.commentText,
              commentType: field.commentType,
              category: field.category,
              answerType: field.answerType,
              order: field.order,

              options: field.options
                ? JSON.stringify(field.options)
                : null,

              unitOptions: field.unitOptions
                ? JSON.stringify(field.unitOptions)
                : null,

              recommendation: field.recommendation,

              defaultValue: field.defaultValue,
              defaultValue2: field.defaultValue2,
              defaultUnitType: field.defaultUnitType,

              estimateMin: field.estimateMin,
              estimateMax: field.estimateMax,

              locked: field.locked,
              simpleFormat: field.simpleFormat,
              disablePhotos: field.disablePhotos,
              uses: field.uses,
            });

            fieldMappings.push({
              fieldId,
              photos: field.photos,
            });
          }

          subsectionIndex++;
        }
      }

      await tx.field.createMany({
        data: fieldRows,
      });

      const photoRows = fieldMappings.flatMap((mapping) =>
        mapping.photos.map((photo) => ({
          id: randomUUID(),
          fieldId: mapping.fieldId,
          url: photo.url,
          caption: photo.caption,
        })),
      );

      if (photoRows.length > 0) {
        await tx.photo.createMany({
          data: photoRows,
        });
      }

      const issueRows = template.issues.map((issue) => ({
        id: randomUUID(),
        templateId,
        sourceRow: issue.sourceRow,
        type: issue.type,
        message: issue.message,
        sourceData: issue.sourceData
          ? JSON.stringify(issue.sourceData)
          : null,
      }));

      if (issueRows.length > 0) {
        await tx.importIssue.createMany({
          data: issueRows,
        });
      }

      return {
        id: templateId,
      };
    },
    {
      maxWait: 10_000,
      timeout: 30_000,
    },
  );
}

export async function duplicateTemplate(templateId: string) {
  const original = await prisma.template.findUnique({
    where: {
      id: templateId,
    },
    include: {
      sections: {
        orderBy: {
          order: "asc",
        },
        include: {
          subsections: {
            orderBy: {
              order: "asc",
            },
            include: {
              fields: {
                orderBy: {
                  order: "asc",
                },
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

  if (!original) {
    throw new Error("Template not found");
  }

  return prisma.$transaction(
    async (tx) => {
      const copyId = randomUUID();

      await tx.template.create({
        data: {
          id: copyId,
          name: `${original.name} (Copy)`,
          source: original.source,
        },
      });

      const sectionRows = original.sections.map((section) => ({
        id: randomUUID(),
        templateId: copyId,
        name: section.name,
        order: section.order,
      }));

      await tx.section.createMany({
        data: sectionRows,
      });

      const subsectionRows = original.sections.flatMap(
        (section, sectionIndex) => {
          const sectionRow = sectionRows[sectionIndex];

          if (!sectionRow) {
            throw new Error("Section ID could not be resolved");
          }

          return section.subsections.map((subsection) => ({
            id: randomUUID(),
            sectionId: sectionRow.id,
            name: subsection.name,
            order: subsection.order,
          }));
        },
      );

      await tx.subsection.createMany({
        data: subsectionRows,
      });

      const fieldRows: Array<{
        id: string;
        subsectionId: string;
        name: string;
        commentText: string | null;
        commentType: string;
        category: number | null;
        answerType: string | null;
        order: number;
        options: string | null;
        unitOptions: string | null;
        recommendation: string | null;
        defaultValue: string | null;
        defaultValue2: string | null;
        defaultUnitType: string | null;
        estimateMin: number | null;
        estimateMax: number | null;
        locked: boolean;
        simpleFormat: boolean;
        disablePhotos: boolean;
        uses: string | null;
      }> = [];

      const photoMappings: Array<{
        fieldId: string;
        photos: Array<{
          url: string;
          caption: string | null;
        }>;
      }> = [];

      let subsectionIndex = 0;

      for (const section of original.sections) {
        for (const subsection of section.subsections) {
          const subsectionRow = subsectionRows[subsectionIndex];

          if (!subsectionRow) {
            throw new Error("Subsection ID could not be resolved");
          }

          for (const field of subsection.fields) {
            const fieldId = randomUUID();

            fieldRows.push({
              id: fieldId,
              subsectionId: subsectionRow.id,
              name: field.name,
              commentText: field.commentText,
              commentType: field.commentType,
              category: field.category,
              answerType: field.answerType,
              order: field.order,

              options: field.options,
              unitOptions: field.unitOptions,
              recommendation: field.recommendation,

              defaultValue: field.defaultValue,
              defaultValue2: field.defaultValue2,
              defaultUnitType: field.defaultUnitType,

              estimateMin: field.estimateMin,
              estimateMax: field.estimateMax,

              locked: field.locked,
              simpleFormat: field.simpleFormat,
              disablePhotos: field.disablePhotos,
              uses: field.uses,
            });

            photoMappings.push({
              fieldId,
              photos: field.photos.map((photo) => ({
                url: photo.url,
                caption: photo.caption,
              })),
            });
          }

          subsectionIndex++;
        }
      }

      await tx.field.createMany({
        data: fieldRows,
      });

      const photoRows = photoMappings.flatMap((mapping) =>
        mapping.photos.map((photo) => ({
          id: randomUUID(),
          fieldId: mapping.fieldId,
          url: photo.url,
          caption: photo.caption,
        })),
      );

      if (photoRows.length > 0) {
        await tx.photo.createMany({
          data: photoRows,
        });
      }

      const issueRows = original.issues.map((issue) => ({
        id: randomUUID(),
        templateId: copyId,
        sourceRow: issue.sourceRow,
        type: issue.type,
        message: issue.message,
        sourceData: issue.sourceData,
      }));

      if (issueRows.length > 0) {
        await tx.importIssue.createMany({
          data: issueRows,
        });
      }

      return {
        id: copyId,
      };
    },
    {
      maxWait: 10_000,
      timeout: 30_000,
    },
  );
}

export async function listTemplates() {
  const templates = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      source: string;
      sectionCount: number;
      subsectionCount: number;
      fieldCount: number;
      updatedAt: Date;
    }>
  >`
    SELECT
      t.id,
      t.name,
      t.source,
      t."updatedAt",
      COUNT(DISTINCT s.id)::int AS "sectionCount",
      COUNT(DISTINCT ss.id)::int AS "subsectionCount",
      COUNT(DISTINCT f.id)::int AS "fieldCount"
    FROM "Template" t
    LEFT JOIN "Section" s
      ON s."templateId" = t.id
    LEFT JOIN "Subsection" ss
      ON ss."sectionId" = s.id
    LEFT JOIN "Field" f
      ON f."subsectionId" = ss.id
    GROUP BY
      t.id,
      t.name,
      t.source,
      t."updatedAt"
    ORDER BY t."updatedAt" DESC
  `;

  return templates;
}
