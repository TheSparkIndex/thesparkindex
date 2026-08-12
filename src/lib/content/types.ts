export type TipMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type TipNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipNode[];
  marks?: TipMark[];
  text?: string;
};
