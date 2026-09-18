import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router-dom";
import TemplateLibrary from "./TemplateLibrary";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;

interface ImportIssue {
  id: string;
  sourceRow: number | null;
  type: string;
  message: string;
  sourceData: Record<string, unknown> | null;
}

interface Field {
  id: string;
  name: string;
  commentText: string | null;
  commentType: string;
  category: number | null;
  answerType: string | null;
  order: number;
}

interface Subsection {
  id: string;
  name: string;
  order: number;
  fields: Field[];
}

interface Section {
  id: string;
  name: string;
  order: number;
  subsections: Subsection[];
}

interface TemplateSummary {
  id: string;
  name: string;
  source: string;
  sectionCount: number;
  subsectionCount: number;
  fieldCount: number;
  updatedAt: string;
}

interface Template {
  id: string;
  name: string;
  source: string;
  sections: Section[];
  issues: ImportIssue[];
}

function TemplatePage() {
  const { id } = useParams<{ id: string }>();

  return <App templateId={id ?? null} />;
}

function App({ templateId }: { templateId?: string | null }) {
  const navigate = useNavigate();

  const [template, setTemplate] = useState<Template | null>(null);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editComment, setEditComment] = useState("");
  const [editingSubsectionId, setEditingSubsectionId] = useState<string | null>(
    null,
  );
  const [editSubsectionName, setEditSubsectionName] = useState("");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionName, setEditSectionName] = useState("");
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [editTemplateName, setEditTemplateName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  function startEditing(field: Field) {
    setEditingFieldId(field.id);
    setEditName(field.name);
    setEditComment(field.commentText ?? "");
  }

  async function saveField(fieldId: string) {
    try {
      setSaveError(null);

      const response = await fetch(`${API_URL}/fields/${fieldId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName,
          commentText: editComment,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save field");
      }

      const updatedField: Field = await response.json();

      setTemplate((currentTemplate) => {
        if (!currentTemplate) {
          return currentTemplate;
        }

        return {
          ...currentTemplate,
          sections: currentTemplate.sections.map((section) => ({
            ...section,
            subsections: section.subsections.map((subsection) => ({
              ...subsection,
              fields: subsection.fields.map((field) =>
                field.id === fieldId ? updatedField : field,
              ),
            })),
          })),
        };
      });

      setEditingFieldId(null);
    } catch (error) {
      console.error(error);
      setSaveError("Could not save this field. Please try again.");
    }
  }

  async function saveSubsection(subsectionId: string) {
    try {
      setSaveError(null);

      const response = await fetch(
        `${API_URL}/subsections/${subsectionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editSubsectionName,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save subsection");
      }

      const updatedSubsection: Subsection = await response.json();

      setTemplate((currentTemplate) => {
        if (!currentTemplate) {
          return currentTemplate;
        }

        return {
          ...currentTemplate,
          sections: currentTemplate.sections.map((section) => ({
            ...section,
            subsections: section.subsections.map((subsection) =>
              subsection.id === subsectionId
                ? {
                    ...subsection,
                    name: updatedSubsection.name,
                  }
                : subsection,
            ),
          })),
        };
      });

      setEditingSubsectionId(null);
    } catch (error) {
      console.error(error);
      setSaveError("Could not save this subsection. Please try again.");
    }
  }

  async function saveSection(sectionId: string) {
    try {
      setSaveError(null);

      const response = await fetch(
        `${API_URL}/sections/${sectionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editSectionName,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save section");
      }

      const updatedSection: Section = await response.json();

      setTemplate((currentTemplate) => {
        if (!currentTemplate) {
          return currentTemplate;
        }

        return {
          ...currentTemplate,
          sections: currentTemplate.sections.map((section) =>
            section.id === sectionId
              ? {
                  ...section,
                  name: updatedSection.name,
                }
              : section,
          ),
        };
      });

      setEditingSectionId(null);
    } catch (error) {
      console.error(error);
      setSaveError("Could not save this section. Please try again.");
    }
  }

  async function saveTemplate() {
    if (!template) {
      return;
    }

    try {
      setSaveError(null);

      const response = await fetch(
        `${API_URL}/templates/${template.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editTemplateName,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save template");
      }

      const updatedTemplate: Template = await response.json();

      setTemplate((currentTemplate) => {
        if (!currentTemplate) {
          return currentTemplate;
        }

        return {
          ...currentTemplate,
          name: updatedTemplate.name,
        };
      });

      setEditingTemplate(false);
    } catch (error) {
      console.error(error);
      setSaveError("Could not save the template name. Please try again.");
    }
  }

  async function duplicateTemplate() {
    if (!template || duplicating) {
      return;
    }

    try {
      setDuplicating(true);

      const response = await fetch(
        `${API_URL}/templates/${template.id}/duplicate`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to duplicate template");
      }

      const copiedTemplate: Template = await response.json();

      setTemplate(copiedTemplate);
    } catch (error) {
      console.error(error);
    } finally {
      setDuplicating(false);
    }
  }

  async function importTemplate() {
    if (!selectedFile) {
      return;
    }

    try {
      setImporting(true);
      setImportError(null);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_URL}/imports/spectora`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to import template");
      }

      await response.json();

      await loadTemplates();

      setTemplate(null);
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
      setImportError("Could not import this template. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  function selectTemplate(templateId: string) {
    navigate(`/templates/${templateId}`);
  }

  async function loadTemplates() {
    try {
      const response = await fetch(`${API_URL}/templates`);

      if (!response.ok) {
        throw new Error("Failed to load templates");
      }

      const data: TemplateSummary[] = await response.json();

      setTemplates(data);
    } catch (error) {
      console.error(error);
    }
  }

  function getIssueSourceData(
    sourceData: Record<string, unknown> | string | null,
  ): Record<string, unknown> | null {
    if (!sourceData) {
      return null;
    }

    if (typeof sourceData === "string") {
      try {
        return JSON.parse(sourceData);
      } catch {
        return null;
      }
    }

    return sourceData;
  }

  const sectionCount = template?.sections.length ?? 0;

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

  useEffect(() => {
    if (!templateId) {
      loadTemplates();
      setLoadingTemplate(false);
      return;
    }

    setLoadingTemplate(true);

    fetch(`${API_URL}/templates/${templateId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load template");
        }

        return response.json();
      })
      .then((data: Template) => {
        setTemplate(data);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setLoadingTemplate(false);
      });
  }, [templateId]);

  return (
    <div className="app">
      {loadingTemplate ? (
        <div className="template-loading">
          <strong>Loading template...</strong>
          <p>Preparing the template editor.</p>
        </div>
      ) : (
        <>
          {!template && (
            <>
              <div className="import-panel">
                <div className="import-panel-header">
                  <div>
                    <span className="eyebrow">TEMPLATE MIGRATION</span>
                    <h2>Import a Spectora template</h2>
                    <p>
                      Upload an exported Spectora template to preserve its
                      structure, fields, and comments.
                    </p>
                  </div>
                </div>
                <div
                  className={`upload-zone ${selectedFile ? "has-file" : ""}`}
                  onClick={() =>
                    document.getElementById("template-file-input")?.click()
                  }
                >
                  <input
                    id="template-file-input"
                    type="file"
                    accept=".xls"
                    onChange={(event) => {
                      setSelectedFile(event.target.files?.[0] ?? null);
                    }}
                  />

                  {selectedFile ? (
                    <>
                      <div className="upload-icon">✓</div>
                      <strong>{selectedFile.name}</strong>
                      <span>Ready to import</span>
                    </>
                  ) : (
                    <>
                      <div className="upload-icon">↑</div>
                      <strong>Upload a Spectora template</strong>
                      <span>Choose an exported .xls file</span>
                    </>
                  )}
                </div>

                <div className="import-actions">
                  <button
                    onClick={importTemplate}
                    disabled={!selectedFile || importing}
                  >
                    {importing ? "Importing..." : "Import Template"}
                  </button>

                  {selectedFile && (
                    <span className="import-hint">
                      Your original file will not be modified.
                    </span>
                  )}
                </div>

                {importError && <p className="import-error">{importError}</p>}
              </div>
              <TemplateLibrary
                templates={templates}
                onSelectTemplate={selectTemplate}
              />
            </>
          )}
          {template && (
            <div className="template-header">
              <button
                className="back-to-templates"
                onClick={() => navigate("/")}
              >
                ← Back to Templates
              </button>

              {editingTemplate ? (
                <div>
                  <input
                    type="text"
                    value={editTemplateName}
                    onChange={(event) =>
                      setEditTemplateName(event.target.value)
                    }
                  />

                  <button onClick={saveTemplate}>Save</button>

                  <button onClick={() => setEditingTemplate(false)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="template-title-row">
                  <h1>{template.name}</h1>

                  <button
                    onClick={() => {
                      setEditingTemplate(true);
                      setEditTemplateName(template.name);
                    }}
                  >
                    Edit Template Name
                  </button>
                </div>
              )}
            </div>
          )}
          {template && (
            <>
              {template.issues.length === 0 ? (
                <div className="import-summary">
                  <strong>✓ Import complete</strong>

                  <p>
                    Imported from <strong>{template.source}</strong>
                  </p>

                  <p>
                    {sectionCount} sections · {subsectionCount} subsections ·{" "}
                    {fieldCount} fields
                  </p>
                </div>
              ) : (
                <div className="import-warning">
                  <div className="import-warning-header">
                    <span className="import-warning-icon">!</span>

                    <div>
                      <strong>
                        Import completed with {template.issues.length}{" "}
                        {template.issues.length === 1 ? "warning" : "warnings"}
                      </strong>

                      <p>
                        The template was imported, but some content needs
                        attention.
                      </p>
                    </div>
                  </div>

                  <div className="import-warning-issues">
                    {template.issues.map((issue) => {
                      const sourceData = getIssueSourceData(issue.sourceData);

                      return (
                        <div className="import-issue" key={issue.id}>
                          <div className="import-issue-title">
                            <strong>
                              {issue.type === "unsupported_by_importer"
                                ? "Unsupported content"
                                : "Missing from export"}
                            </strong>

                            {issue.sourceRow !== null && (
                              <span>Source row {issue.sourceRow}</span>
                            )}
                          </div>

                          {sourceData && (
                            <p className="import-issue-location">
                              {String(sourceData["Section Name"])} →{" "}
                              {String(sourceData["Item Name"])} →{" "}
                              {String(sourceData["Comment Name"])}
                            </p>
                          )}

                          <p>{issue.message}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
          {template && (
            <div className="template-actions">
              <button onClick={duplicateTemplate} disabled={duplicating}>
                {duplicating ? "Duplicating..." : "Duplicate Template"}
              </button>
            </div>
          )}

          {template?.sections.map((section) => (
            <details key={section.id}>
              <summary>
                {editingSectionId === section.id ? (
                  <div className="summary-content">
                    <input
                      type="text"
                      value={editSectionName}
                      onChange={(event) =>
                        setEditSectionName(event.target.value)
                      }
                    />

                    <button onClick={() => saveSection(section.id)}>
                      Save
                    </button>

                    <button onClick={() => setEditingSectionId(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="summary-content">
                    <strong>{section.name}</strong>

                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setEditingSectionId(section.id);
                        setEditSectionName(section.name);
                      }}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </summary>

              {section.subsections.map((subsection) => (
                <details key={subsection.id}>
                  <summary>
                    {editingSubsectionId === subsection.id ? (
                      <div className="summary-content">
                        <input
                          type="text"
                          value={editSubsectionName}
                          onChange={(event) =>
                            setEditSubsectionName(event.target.value)
                          }
                        />

                        <button onClick={() => saveSubsection(subsection.id)}>
                          Save
                        </button>

                        <button onClick={() => setEditingSubsectionId(null)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="summary-content">
                        <strong>{subsection.name}</strong>

                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setEditingSubsectionId(subsection.id);
                            setEditSubsectionName(subsection.name);
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </summary>

                  {subsection.fields.map((field) => (
                    <div className="field" key={field.id}>
                      {editingFieldId === field.id ? (
                        <div className="editor">
                          <div className="editor-field">
                            <label>Field name</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(event) =>
                                setEditName(event.target.value)
                              }
                            />
                          </div>

                          <div className="editor-field">
                            <label>Comment text</label>
                            <textarea
                              value={editComment}
                              onChange={(event) =>
                                setEditComment(event.target.value)
                              }
                            />
                          </div>

                          <div className="editor-actions">
                            <button onClick={() => saveField(field.id)}>
                              Save
                            </button>
                            <button onClick={() => setEditingFieldId(null)}>
                              Cancel
                            </button>
                          </div>

                          {saveError && <p>{saveError}</p>}
                        </div>
                      ) : (
                        <div>
                          <div className="field-header">
                            <strong>{field.name}</strong>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                startEditing(field);
                              }}
                            >
                              Edit
                            </button>
                          </div>

                          {field.commentText && (
                            <div
                              className="field-comment"
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(field.commentText),
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </details>
              ))}
            </details>
          ))}
        </>
      )}
    </div>
  );
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/templates/:id" element={<TemplatePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
