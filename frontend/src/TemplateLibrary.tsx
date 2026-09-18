interface TemplateSummary {
  id: string;
  name: string;
  source: string;
  sectionCount: number;
  subsectionCount: number;
  fieldCount: number;
  updatedAt: string;
}

interface TemplateLibraryProps {
  templates: TemplateSummary[];
  onSelectTemplate: (templateId: string) => void;
}

function TemplateLibrary({
  templates,
  onSelectTemplate,
}: TemplateLibraryProps) {
  return (
    <section className="template-library">
      <div className="template-library-header">
        <div>
          <span className="eyebrow">TEMPLATE LIBRARY</span>
          <h2>Your Templates</h2>
          <p>
            Open a template to review, edit, or duplicate its imported
            structure.
          </p>
        </div>

        <span className="template-count">
          {templates.length} {templates.length === 1 ? "template" : "templates"}
        </span>
      </div>

      {templates.length === 0 ? (
        <div className="empty-library">
          <strong>No templates yet</strong>
          <p>Import a Spectora template above to get started.</p>
        </div>
      ) : (
        <div className="template-grid">
          {templates.map((template) => (
            <button
              className="template-card"
              key={template.id}
              onClick={() => onSelectTemplate(template.id)}
            >
              <div className="template-card-top">
                <span className="template-source">{template.source}</span>
                <span className="template-arrow">→</span>
              </div>

              <strong className="template-card-name">
                {template.name}
              </strong>

              <div className="template-card-stats">
                <span>{template.sectionCount} sections</span>
                <span>{template.subsectionCount} subsections</span>
                <span>{template.fieldCount} fields</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default TemplateLibrary;
