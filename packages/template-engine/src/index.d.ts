export type TemplateSchema = {
  id: string;
  name: string;
  category: "TECH" | "BUSINESS" | "DESIGN";
  layout: {
    sections: Array<{
      type: string;
      blocks: Array<{
        key: string;
        label: string;
      }>;
    }>;
  };
};

export type RenderInput = {
  template: TemplateSchema;
  data: Record<string, unknown>;
};

export const renderHtml: (input: RenderInput) => string;
