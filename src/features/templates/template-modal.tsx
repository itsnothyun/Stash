import React, { useState } from "react";
import {
  NoteTemplate,
  getAllTemplates,
  deleteCustomTemplate,
} from "./template-definitions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createAndOpenStash } from "@/features/capture/create-stash";
import { toast } from "@/components/ui/toast";
import {
  LayoutTemplate,
  Sparkles,
  Trash2,
  Tag,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateSelected?: (template: NoteTemplate) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  open,
  onOpenChange,
  onTemplateSelected,
}) => {
  const [templates, setTemplates] = useState<NoteTemplate[]>(() => getAllTemplates());
  const [selectedTemplate, setSelectedTemplate] = useState<NoteTemplate>(
    () => templates[0]
  );
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filtered = templates.filter(
    (t) =>
      activeCategory === "all" ||
      (activeCategory === "custom" ? t.isCustom : t.category === activeCategory)
  );

  const handleApplyTemplate = async (template: NoteTemplate) => {
    if (onTemplateSelected) {
      onTemplateSelected(template);
      onOpenChange(false);
      return;
    }

    try {
      await createAndOpenStash({
        title: template.defaultTitle,
        color: template.defaultColor,
        tagNames: template.tags,
        plainText: template.markdownContent,
      });
      toast.show({
        message: `Created from "${template.name}"`,
        description: "Your new stash is ready for writing",
      });
      onOpenChange(false);
    } catch {
      toast.error("Failed to create note from template");
    }
  };

  const handleDeleteCustom = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteCustomTemplate(id);
    const updated = getAllTemplates();
    setTemplates(updated);
    if (selectedTemplate.id === id) {
      setSelectedTemplate(updated[0]);
    }
    toast.show({ message: "Custom template removed" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 flex flex-col overflow-hidden bg-background border border-border shadow-2xl">
        <DialogHeader className="p-4 border-b border-border/70 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-brand/10 text-brand">
              <LayoutTemplate className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle className="text-sm font-semibold text-foreground">
                Template Studio
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground">
                Jumpstart your thought capture with curated layouts & frameworks.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-border/50 bg-surface/50 overflow-x-auto text-2xs">
          {[
            { id: "all", label: "All Templates" },
            { id: "work", label: "Work & Team" },
            { id: "dev", label: "Dev & Engineering" },
            { id: "personal", label: "Personal & Reflection" },
            { id: "study", label: "Study & Research" },
            { id: "custom", label: "My Custom Templates" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-2.5 py-1 rounded-full border transition-all cursor-pointer font-medium",
                activeCategory === cat.id
                  ? "bg-brand text-brand-foreground border-brand font-semibold shadow-xs"
                  : "bg-surface border-border text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Main 2-Column Split: Template List & Live Preview */}
        <div className="grid grid-cols-1 md:grid-cols-5 flex-1 min-h-0 overflow-hidden">
          {/* Left Column: Template Cards */}
          <div className="md:col-span-2 border-r border-border/70 p-3 overflow-y-auto space-y-2">
            {filtered.map((item) => {
              const isSelected = selectedTemplate?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedTemplate(item)}
                  className={cn(
                    "flex flex-col gap-1 p-2.5 rounded-lg border text-left transition-all cursor-pointer relative group",
                    isSelected
                      ? "border-brand bg-brand/5 shadow-xs ring-1 ring-brand/30"
                      : "border-border/60 bg-surface/40 hover:bg-surface-hover hover:border-border"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground truncate">
                      <span>{item.icon}</span>
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustom(e, item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                        title="Delete custom template"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-surface-hover text-muted-foreground border border-border/50">
                      {item.category}
                    </span>
                    {item.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="text-[9px] font-mono text-muted-foreground flex items-center gap-0.5"
                      >
                        <Tag className="h-2.5 w-2.5 opacity-60" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Template Preview & Action */}
          <div className="md:col-span-3 p-4 flex flex-col min-h-0 bg-surface/30">
            {selectedTemplate ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{selectedTemplate.icon}</span>
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">
                        {selectedTemplate.name}
                      </h4>
                      <p className="text-[10px] text-muted-foreground">
                        {selectedTemplate.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleApplyTemplate(selectedTemplate)}
                    className="h-7 text-xs gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90 cursor-pointer shadow-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Use Template
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>

                {/* Preformatted Markdown Snippet */}
                <div className="flex-1 min-h-0 mt-3 p-3 rounded-lg border border-border/70 bg-surface overflow-y-auto text-xs font-mono leading-relaxed text-foreground select-text whitespace-pre-wrap">
                  {selectedTemplate.markdownContent}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <LayoutTemplate className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-xs">Select a template to preview</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
