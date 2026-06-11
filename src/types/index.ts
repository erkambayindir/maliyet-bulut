export interface ProjectSummary {
  id: string;
  name: string;
  calculationDate: string;
  status: string;
  createdAt: string;
}

export interface WorkGroupTree {
  id: string;
  name: string;
  code: string | null;
  order: number;
  parentId: string | null;
  projectId: string;
  children: WorkGroupTree[];
  projectPozs: ProjectPozRow[];
  total?: number;
}

export interface ProjectPozRow {
  id: string;
  pozNo: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  customPrice: number | null;
  markupPercent: number;
  workGroupId: string;
  order: number;
  total?: number;
}

export interface MetrajRowData {
  id: string;
  projectPozId: string;
  description: string;
  adet: number;
  en: number;
  boy: number;
  yukseklik: number;
  computedQty: number;
  order: number;
}

export interface DemirajRowData {
  id: string;
  projectPozId: string;
  description: string;
  cap: number;
  uzunluk: number;
  adet: number;
  weightPerMeter: number;
  computedKg: number;
  order: number;
}

export interface PozLibraryItem {
  id: string;
  pozNo: string;
  description: string;
  unit: string;
  unitPrice: number;
  year: string;
  institutionName: string;
  fascicleName: string | null;
}
