export type SourceImage = {
  id: string;
  name: string;
  dataUrl: string;
  comment: string;
};

export type Study = {
  id: string;
  title: string;
  dataUrl: string;
  recipe: string;
};

export type ProjectState = {
  id: string;
  sources: SourceImage[];
  studies: Study[];
  updatedAt: number;
};
