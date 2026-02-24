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
  modelId: string;
  modelName: string;
  brandId: string;
  brandName: string;
  year?: string;
  fuelType?: string;
  transmission?: string;
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
