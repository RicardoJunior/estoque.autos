export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface Model {
  id: string;
  name: string;
  slug: string;
  brandId: string;
  brandName: string;
}

export interface Version {
  id: string;
  name: string;
  slug: string;
  yearCode: string;
  modelId: string;
  modelName: string;
  brandId: string;
  brandName: string;
}

export interface FipePrice {
  id: string;
  codigoFipe: string;
  preco: string;
  marca: string;
  modelo: string;
  anoModelo: number;
  combustivel: string;
  siglaCombustivel: string;
  mesReferencia: string;
  modelId: string;
  modelName: string;
  brandId: string;
  brandName: string;
  yearCode: string;
}

export interface CrawlResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
  timestamp: string;
  totalItems: number;
}

export interface CrawlProgress {
  current: number;
  total: number;
  percentage: number;
  errors: number;
}
