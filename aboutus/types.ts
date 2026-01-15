
export interface Product {
  id: string;
  name: string;
  brief: string;
  description: string;
  link: string;
  aiFeatures: string[];
  models: string[];
  platforms: string[];
  techFeatures?: string;
  useCases: string[];
  image: string;
  tag: string;
}

export interface CompanyInfo {
  name: string;
  slogan: string;
  mission: string;
}
