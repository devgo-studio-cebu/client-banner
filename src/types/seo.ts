export interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string[];
}

export interface OrganizationSchema {
  name: string;
  url: string;
  logo: string;
  sameAs?: string[];
}

export interface WebsiteSchema {
  name: string;
  url: string;
  description: string;
}
