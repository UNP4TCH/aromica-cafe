export interface DemoContact {
  name: string;
  role: string;
  phone: string;
  phoneRaw: string;
  phoneHref: string;
  email: string;
  emailHref: string;
  whatsappHref: string;
}

export interface DemoCapability {
  title: string;
  desc: string;
}

export interface DemoConfig {
  enabled: boolean;
  owner: DemoContact;
  secondaryContact: DemoContact;
  attribution: {
    label: string;
    owner: string;
    subline: string;
    footerDisclaimer: string;
  };
  watermark: {
    enabled: boolean;
    text: string;
  };
  externalActions: {
    demoMode: boolean;
    orderingNotice: {
      title: string;
      message: string;
      pitch: string;
      ctaTalk: string;
      ctaWhatsApp: string;
    };
  };
  salesCta: {
    badge: string;
    headline: string;
    supportingCopy: string;
    capabilitiesTitle: string;
    capabilities: DemoCapability[];
  };
}

export const demoConfig: DemoConfig = {
  enabled: true,

  owner: {
    name: "Susmit Dey",
    role: "Lead Designer & Developer",
    phone: "+91 9007801474",
    phoneRaw: "919007801474",
    phoneHref: "tel:+919007801474",
    email: "susmitdey047@gmail.com",
    emailHref: "mailto:susmitdey047@gmail.com",
    whatsappHref:
      "https://wa.me/919007801474?text=Hi%20Susmit%2C%20I%20saw%20your%20Aromica%20Caf%C3%A9%20website%20concept%20and%20would%20like%20to%20discuss%20a%20website%20for%20my%20business.",
  },

  secondaryContact: {
    name: "Tuhimrahamain",
    role: "Client Relations & Strategy",
    phone: "+91 7439077643",
    phoneRaw: "917439077643",
    phoneHref: "tel:+917439077643",
    email: "tuhimrahamain@gmail.com",
    emailHref: "mailto:tuhimrahamain@gmail.com",
    whatsappHref:
      "https://wa.me/917439077643?text=Hi%20Tuhim%2C%20I%20saw%20your%20Aromica%20Caf%C3%A9%20website%20concept%20and%20would%20like%20to%20discuss%20a%20website.",
  },

  attribution: {
    label: "Website Concept",
    owner: "Susmit Dey",
    subline: "Portfolio project by Susmit Dey",
    footerDisclaimer:
      "This is an independent portfolio and sales concept created for demonstration purposes. Not an official website commissioned, endorsed, or operated by Aromica Café.",
  },

  watermark: {
    enabled: true,
    text: "CONCEPT • SUSMIT DEY",
  },

  externalActions: {
    demoMode: true,
    orderingNotice: {
      title: "Website Concept — Online Ordering",
      message:
        "This is a website concept. In a real client deployment, this button can connect to the café's existing ordering platform, WhatsApp ordering, or a custom ordering system.",
      pitch: "Want a website like this for your café?",
      ctaTalk: "Talk to Susmit",
      ctaWhatsApp: "WhatsApp",
    },
  },

  salesCta: {
    badge: "Portfolio Showcase",
    headline: "Want a website like this for your café?",
    supportingCopy: "Your branding. Your menu. Your photos. Your customers.",
    capabilitiesTitle: "Built around your business",
    capabilities: [
      {
        title: "Menu",
        desc: "Digital menu, categories & search",
      },
      {
        title: "Brand",
        desc: "Colors, typography & visual identity",
      },
      {
        title: "Discovery",
        desc: "Maps, Instagram & local SEO",
      },
      {
        title: "Conversion",
        desc: "WhatsApp, ordering & integrations",
      },
      {
        title: "Experience",
        desc: "Gallery, motion & mobile-first UX",
      },
    ],
  },
};
