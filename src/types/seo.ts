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

export interface LocalBusinessSchema {
  "@type": "LocalBusiness";
  name: string;
  url: string;
  logo?: string;
  description?: string;
  address?: {
    "@type": "PostalAddress";
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  telephone?: string;
  email?: string;
  sameAs?: string[];
  geographicCoordinates?: {
    "@type": "GeoCoordinates";
    latitude: number;
    longitude: number;
  };
}

export interface BreadcrumbListSchema {
  "@type": "BreadcrumbList";
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string;
  }[];
}
