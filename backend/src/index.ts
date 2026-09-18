import express from "express";
import cors from "cors";
import multer from "multer";
import XLSX from "xlsx";
import path from "node:path";

import { prisma } from "./lib/prisma.js";
import {
  createTemplate,
  duplicateTemplate,
  listTemplates,
} from "./scripts/repositories/templateRepository.js";
import { parseSpectora } from "./importer/parseSpectora.js";

const app = express();
app.use(cors());
app.use(express.json());
const PORT = Number(process.env.PORT) || 3000;

const upload = multer({
  storage: multer.memoryStorage(),
});

app.get("/", (_req, res) => {
  res.send("Hive Template Importer backend is running!");
});

app.get("/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

app.get("/templates", async (_req, res) => {
  try {
    const templates = await listTemplates();

    res.json(templates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load templates" });
  }
});

app.get("/templates/:id", async (req, res) => {
  try {
    const template = await prisma.template.findUnique({
      where: {
        id: req.params.id,
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
                },
              },
            },
          },
        },
        issues: true,
      },
    });

    if (!template) {
      res.status(404).json({
        error: "Template not found",
      });
      return;
    }

    res.json(template);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to load template",
    });
  }
});

app.patch("/fields/:id", async (req, res) => {
  try {
    const { name, commentText } = req.body;

    const field = await prisma.field.update({
      where: {
        id: req.params.id,
      },
      data: {
        name,
        commentText,
      },
    });

    res.json(field);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to update field",
    });
  }
});

app.patch("/subsections/:id", async (req, res) => {
  try {
    const { name } = req.body;

    const subsection = await prisma.subsection.update({
      where: {
        id: req.params.id,
      },
      data: {
        name,
      },
    });

    res.json(subsection);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to update subsection",
    });
  }
});

app.patch("/sections/:id", async (req, res) => {
  try {
    const { name } = req.body;

    const section = await prisma.section.update({
      where: {
        id: req.params.id,
      },
      data: {
        name,
      },
    });

    res.json(section);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to update section",
    });
  }
});

app.patch("/templates/:id", async (req, res) => {
  try {
    const { name } = req.body;

    if (typeof name !== "string" || name.trim() === "") {
      res.status(400).json({
        error: "Template name is required",
      });
      return;
    }

    const template = await prisma.template.update({
      where: {
        id: req.params.id,
      },
      data: {
        name: name.trim(),
      },
    });

    res.json(template);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to update template",
    });
  }
});

app.post("/templates/:id/duplicate", async (req, res) => {
  try {
    const copy = await duplicateTemplate(req.params.id);

    const copiedTemplate = await prisma.template.findUnique({
      where: {
        id: copy.id,
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
                },
              },
            },
          },
        },
        issues: true,
      },
    });

    if (!copiedTemplate) {
      res.status(404).json({
        error: "Copied template not found",
      });
      return;
    }

    res.status(201).json(copiedTemplate);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to duplicate template",
    });
  }
});

app.post("/imports/spectora", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({
        error: "No file uploaded",
      });
      return;
    }

    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer",
    });

    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      res.status(400).json({
        error: "The uploaded spreadsheet has no sheets",
      });
      return;
    }

    const worksheet = workbook.Sheets[firstSheetName];

    if (!worksheet) {
      res.status(400).json({
        error: "Could not read the first worksheet",
      });
      return;
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      worksheet,
      {
        defval: null,
      },
    );

    const templateName =
      typeof req.body.templateName === "string" &&
      req.body.templateName.trim() !== ""
        ? req.body.templateName.trim()
        : path.parse(req.file.originalname).name;

    const parsedTemplate = parseSpectora(rows, templateName);

    const createdTemplate = await createTemplate(parsedTemplate);

    const fullTemplate = await prisma.template.findUnique({
      where: {
        id: createdTemplate.id,
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
                },
              },
            },
          },
        },
        issues: true,
      },
    });

    if (!fullTemplate) {
      res.status(500).json({
        error: "Template was created but could not be loaded",
      });
      return;
    }

    res.status(201).json(fullTemplate);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to import Spectora template",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
