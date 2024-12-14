export interface WebsiteContent {
  businessName: string;
  aboutUs: string;
  services: string[];
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  leadForm: {
    enabled: boolean;
    fields: {
      name: boolean;
      email: boolean;
      phone: boolean;
      message: boolean;
    };
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
}

export interface Website {
  id: string;
  profileId: string;
  subdomain: string;
  content: WebsiteContent;
  published: boolean;
  createdAt: string;
  updatedAt: string;
} 