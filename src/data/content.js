export const navLinksLeft = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
]

export const navLinksRight = [
  { label: "Projects", href: "#projects" },
]

export const navLinks = [...navLinksLeft, ...navLinksRight]

export const footerQuickLinks = [
  ...navLinksLeft,
  ...navLinksRight,
  { label: "Contact", href: "#contact" },
]

export const authLinks = {
  login: "/login",
  register: "/register",
}

const S = "/assets/scraped"
const E = "/assets/enhanced"

export const assets = {
  logo: `${S}/branding/setu-logo.png`,
  favicon: "/favicon.png",
  favicon16: "/favicon-16.png",
  favicon48: "/favicon-48.png",
  appleTouchIcon: `${S}/branding/apple-touch-icon.png`,
  heroFallback: `${E}/general/hero-fg.webp`,
  aboutImage: `${E}/general/about-team.webp`,
  aboutBanner: `${E}/services/preventive-ehealth-center.webp`,
  servicesHero: `${E}/general/services-oiu.webp`,
  heroVideo: "/videos/herovideo.mp4?v=2",
  storyVideo: "/videos/setu-story-web.mp4",
  preventive: {
    ehealthCenter: `${E}/services/preventive-ehealth-center.webp`,
    healthKit: `${E}/services/preventive-health-kit.webp`,
  },
  telemedicine: [
    `${E}/services/telemedicine-1.webp`,
    `${E}/services/telemedicine-2.webp`,
    `${E}/services/telemedicine-3.webp`,
  ],
  motherChild: [
    `${E}/services/mother-child-matru1.webp`,
    `${E}/services/mother-child-matru2.webp`,
    `${E}/services/mother-child-child1.webp`,
    `${E}/services/mother-child-child2.webp`,
  ],
  devices: {
    wind: `${E}/services/setu-wind.webp`,
    windAlt: `${E}/services/setu-wind-alt.webp`,
    air: `${E}/services/setu-air.webp`,
    airWall: `${E}/services/setu-air-wall.webp`,
  },
  projects: {
    sundargarh: `${E}/projects/sundargarh-eswasthya.webp`,
    matrujyoti: `${E}/projects/matrujyoti.webp`,
    nalanda: `${E}/projects/nalanda-preventive.webp`,
    khatima: `${E}/projects/khatima-checkups.webp`,
    pune: `${E}/projects/pune-pmc-pilot.webp`,
    portfolio: `${E}/projects/portfolio-4.webp`,
  },
  person: [
    `${S}/person/person-f-3.webp`,
    `${S}/person/person-f-6.webp`,
    `${S}/person/person-f-8.webp`,
    `${S}/person/person-f-10.webp`,
    `${S}/person/person-f-12.webp`,
    `${S}/person/person-m-7.webp`,
    `${S}/person/person-m-8.webp`,
    `${S}/person/person-m-12.webp`,
  ],
}

export const impactStats = [
  { value: 30000, suffix: "+", label: "Citizens Screened", detail: "eSwasthya, Odisha" },
  { value: 68000, suffix: "+", label: "USG Conducted", detail: "Matrujyoti Program" },
  { value: 9298, suffix: "+", label: "Preventive Checkups", detail: "Nalanda, Bihar" },
  { value: 5, suffix: "", label: "States & Regions", detail: "Active deployments" },
]

const DASHBOARD = "/assets/dashboard"

/** Modules shown on the SETU app home grid (HomeScreen.js STATIC_HOME_ICONS) */
export const appModules = [
  {
    id: "telemedicine",
    appId: 2,
    title: "Telemedicine",
    tagline: "Consult doctors online, anywhere",
    description:
      "Connect with qualified doctors for online consultations, prescriptions, and follow-ups. Book appointments by city, access emergency doctors, and get timely medical advice without visiting a clinic.",
    icon: `${DASHBOARD}/Appointment.png`,
    highlights: [
      "Online doctor consultations with video support",
      "City-based doctor discovery and appointment booking",
      "Emergency doctor access for urgent needs",
      "Ratings, rescheduling, and prescription management",
    ],
    stats: [
      { value: "24/7", label: "Doctor access" },
      { value: "Video", label: "Consult support" },
    ],
  },
  {
    id: "book-tests",
    appId: 3,
    title: "Book Tests",
    tagline: "Trusted lab tests at your doorstep",
    description:
      "Compare and book diagnostic tests from certified labs via Thyrocare integration. Schedule home sample collection by pincode, choose health packages, and receive accurate digital reports on time.",
    icon: `${DASHBOARD}/Book_Test.png`,
    highlights: [
      "Thyrocare lab catalog with home sample collection",
      "Full-body checkup packages for men and women",
      "Pincode-based serviceability and pickup slots",
      "Digital health cards and downloadable reports",
    ],
    stats: [
      { value: "25+", label: "Certified lab tests" },
      { value: "Home", label: "Sample collection" },
    ],
  },
  {
    id: "generic-medicine",
    appId: 15,
    title: "Generic Medicine",
    tagline: "Affordable medicines, delivered fast",
    description:
      "Compare branded and generic medicine prices to choose affordable alternatives. Upload prescriptions, order from nearby pharmacies with delivery in 24 hours, and find Jan Aushadhi stores near you.",
    icon: `${DASHBOARD}/Generic_Medicine.png`,
    highlights: [
      "Branded vs generic price comparison — save up to ₹3,000/year",
      "Prescription upload and express pharmacy delivery",
      "Nearby Jan Aushadhi store discovery",
      "Order tracking from local pharmacies",
    ],
    stats: [
      { value: "24 hrs", label: "Delivery window" },
      { value: "₹3K", label: "Potential yearly savings" },
    ],
  },
  {
    id: "mental-health",
    appId: 23,
    title: "Mental Health",
    tagline: "Understand and improve emotional wellness",
    description:
      "Assess mental well-being with guided self-check tests and scored results. Book a stress quantification device for at-home technician-assisted screening, or connect with a mental wellness specialist.",
    icon: `${DASHBOARD}/Mental_Health.png`,
    highlights: [
      "Self-assessment questionnaires with history and insights",
      "Stress quantification device — non-invasive, real-time results",
      "Book a specialist for counselling sessions",
      "Activity log and mood pattern tracking",
    ],
    stats: [
      { value: "Self", label: "Assessment tests" },
      { value: "Home", label: "Device booking" },
    ],
  },
  {
    id: "govt-schemes",
    appId: 16,
    title: "Government Schemes",
    tagline: "500+ health & welfare schemes",
    description:
      "Explore central and state government health schemes in one place. Use the eligibility wizard to find programs based on your demographics, income, caste, disability, and residence — powered by MyScheme.gov.in.",
    icon: `${DASHBOARD}/Govt_Schemes.png`,
    highlights: [
      "500+ central and state schemes accessible",
      "Personalized eligibility search from your profile",
      "Health and welfare programs across all 28 states & UTs",
      "Save schemes and submit interest applications",
    ],
    stats: [
      { value: "500+", label: "Schemes" },
      { value: "28+", label: "States & UTs" },
    ],
  },
  {
    id: "drug-directory",
    appId: 19,
    title: "Drug Directory",
    tagline: "Know your medicines, stay safe",
    description:
      "Search medicines by name, category, or symptoms. Access detailed drug information including uses, dosage, and safety guidelines. Includes Ayurvedic medicines, pill identifier, side-effect analysis, and medication reminders.",
    icon: `${DASHBOARD}/Drug_Directory.png`,
    highlights: [
      "A–Z drug directory with categories and search",
      "Pill identifier and symptom checker",
      "Ayurveda medicine information",
      "Daily medication reminders and health news",
    ],
    stats: [
      { value: "A–Z", label: "Drug index" },
      { value: "Rx", label: "Reminders" },
    ],
  },
  {
    id: "agriculture",
    appId: 18,
    title: "Agriculture",
    tagline: "Smart farming guidance & support",
    description:
      "Agri-Connect brings crop care tips, soil test booking, weather insights, and farming products to rural communities. Mark fields, access agri knowledge articles, and connect with experts for inquiries.",
    icon: `${DASHBOARD}/Agri_Solutions.png`,
    highlights: [
      "Soil testing and crop rotation guidance",
      "Field mapping with weather and crop details",
      "Agri products marketplace with cart and orders",
      "Expert inquiries and farming knowledge hub",
    ],
    stats: [
      { value: "Soil", label: "Test booking" },
      { value: "Crops", label: "Care guides" },
    ],
  },
  {
    id: "abha",
    appId: 20,
    title: "ABHA",
    tagline: "Your digital health identity",
    description:
      "Create or access your Ayushman Bharat Health Account (ABHA) to securely manage digital health records. Link facilities, share records with consent, discover health documents, and avail government benefits with one national health ID.",
    icon: `${DASHBOARD}/Aabha.png`,
    highlights: [
      "14-digit ABHA number with self-declared ABHA address",
      "Link records across hospitals, labs, and doctors",
      "PHR app login with consent-based sharing",
      "ABDM / National Digital Health Mission integration",
    ],
    stats: [
      { value: "1 ID", label: "All records" },
      { value: "Govt", label: "NDHM linked" },
    ],
  },
  {
    id: "fitness",
    appId: 7,
    title: "Fitness",
    tagline: "Workouts, nutrition & dietitian care",
    description:
      "AI-assisted fitness with personalized workouts, meal plans, water intake tracking, and healthy recipes. Book dietitian consultations, sync with Google Fit, and track daily habits for preventive wellness.",
    icon: `${DASHBOARD}/Fitness.png`,
    highlights: [
      "Workout plans and daily activity tracking",
      "Nutrition breakdown with meal and recipe guides",
      "Water tracker and healthy food swaps",
      "Dietitian consultations and custom diet plans",
    ],
    stats: [
      { value: "Meals", label: "Nutrition plans" },
      { value: "Fit", label: "Google Fit sync" },
    ],
  },
]

/** @deprecated Use appModules — kept for backward compatibility */
export const initiatives = appModules

export const innovationFeatures = [
  {
    id: "dashboards",
    title: "Real-Time Health Dashboards",
    tagline: "Live visibility across programs",
    description:
      "Cloud-connected dashboards give health teams instant insight into screenings, trends, and outcomes — from district camps to statewide deployments.",
    image: assets.preventive.ehealthCenter,
    icon: "chart",
  },
  {
    id: "risk-scoring",
    title: "Predictive Risk Scoring",
    tagline: "Act before conditions escalate",
    description:
      "AI models analyze screening data to flag at-risk individuals early — enabling timely follow-ups, referrals, and preventive interventions at scale.",
    image: assets.preventive.healthKit,
    icon: "brain",
  },
]

export const setuPlatform = {
  title: "SETU Health Super App",
  tagline: "All your healthcare needs, in one place",
  description:
    "A comprehensive digital health platform connecting citizens with preventive screening, telemedicine, lab tests, maternal care, ABHA records, mental wellness, emergency SOS, and 500+ government schemes — available across India via the SETU mobile app.",
  stats: [
    { value: "28+", label: "Smart device tests" },
    { value: "500+", label: "Government schemes" },
    { value: "15+", label: "Health services" },
    { value: "5", label: "App languages" },
  ],
  services: [
    "Preventive Health",
    "Book Tests",
    "Telemedicine",
    "Matrujyoti",
    "ABHA / PHR",
    "Mental Health",
    "Generic Medicine",
    "SOS Emergency",
    "Govt Schemes",
    "Fitness",
  ],
  image: assets.aboutImage,
  gallery: [
    assets.preventive.ehealthCenter,
    assets.telemedicine[0],
    assets.motherChild[0],
  ],
}

export const deployments = [
  {
    id: "sundargarh",
    name: "eSwasthya",
    location: "Sundargarh, Odisha",
    state: "Odisha",
    year: "2024",
    impact: "30,000+ citizens screened",
    tagline: "State-government preventive care at scale",
    description:
      "Partnership with Odisha government delivering free preventive health check-ups across Sundargarh district. ASHA workers use SETU screening kits while citizens access results, follow-ups, and maternal records through the mobile app.",
    lat: 22.12,
    lng: 84.04,
    stateId: "or",
    image: assets.projects.sundargarh,
    gallery: [
      assets.projects.sundargarh,
      assets.preventive.ehealthCenter,
      assets.preventive.healthKit,
    ],
    highlights: [
      "ASHA Health Screening Kit — BP, glucose, SpO₂, pulse, BMI & hemoglobin",
      "Cloud-connected mobile app with real-time district dashboards",
      "Matrujyoti digitization for mother & child records in the same program",
      "ABHA-linked health records for long-term care continuity",
    ],
    services: ["Preventive Health", "Matrujyoti", "ABHA", "Book Tests", "Telemedicine"],
  },
  {
    id: "matrujyoti",
    name: "Matrujyoti",
    location: "Odisha (statewide)",
    state: "Odisha",
    year: "2024",
    impact: "68,000+ USG conducted",
    tagline: "End-to-end maternal & child health",
    description:
      "Statewide mother and child health program digitized through SETU — pregnancy tracking, ultrasound reports, child growth charts, vaccinations, and diet guidance delivered via the Matrujyoti module in the mobile app.",
    lat: 20.95,
    lng: 85.1,
    stateId: "or",
    image: assets.projects.matrujyoti,
    gallery: [
      assets.projects.matrujyoti,
      assets.motherChild[0],
      assets.motherChild[1],
    ],
    highlights: [
      "68,000+ ultrasound reports digitized and accessible in the app",
      "Trimester-based diet, exercise & supplement guidance for mothers",
      "Child health module — growth tracking, vaccinations & allergies",
      "Measurable MDR (Mother Death Review) reduction during the program",
    ],
    services: ["Matrujyoti", "ABHA", "Health Reports", "Telemedicine", "Book Tests"],
  },
  {
    id: "nalanda",
    name: "Preventive Health Centers",
    location: "Nalanda, Bihar",
    state: "Bihar",
    year: "2023",
    impact: "9,298+ citizens screened",
    tagline: "Community screening with live analytics",
    description:
      "Preventive health centers in Nalanda district equipped with SETU's cloud-connected screening workflow — frontline workers capture vitals on portable devices while program managers monitor outcomes in real time.",
    lat: 25.13,
    lng: 85.45,
    stateId: "br",
    image: assets.projects.nalanda,
    gallery: [
      assets.projects.nalanda,
      assets.preventive.ehealthCenter,
      assets.preventive.healthKit,
    ],
    highlights: [
      "9,298+ citizens screened across preventive health centers",
      "Portable multi-parameter screening at community PHCs",
      "Real-time data sync to program dashboards for district teams",
      "Foundation for pincode-based home collection rollout",
    ],
    services: ["Preventive Health", "ASHA Kit", "Dashboard Analytics", "ABHA"],
  },
  {
    id: "khatima",
    name: "Preventive Checkups",
    location: "Khatima, Uttarakhand",
    state: "Uttarakhand",
    year: "2024",
    impact: "1,000 citizens in one day",
    tagline: "High-throughput single-day camp",
    description:
      "A single-day preventive health camp in Khatima screened 1,000 citizens using SETU's camp deployment model — slot management, device-based vitals capture, and instant digital records for every participant.",
    lat: 28.92,
    lng: 79.97,
    stateId: "ut",
    image: assets.projects.khatima,
    gallery: [
      assets.projects.khatima,
      assets.preventive.healthKit,
      assets.devices.wind,
    ],
    highlights: [
      "1,000 complete preventive checkups in a single day",
      "28+ device-based tests including cardiac & metabolic screening",
      "Camp slot workflow designed for rural high-throughput deployment",
      "Digital health records issued to every screened citizen",
    ],
    services: ["Preventive Health", "ASHA Kit", "Health Reports", "Book Tests"],
  },
  {
    id: "pune",
    name: "PMC Pilot",
    location: "Pune, Maharashtra",
    state: "Maharashtra",
    year: "2024",
    impact: "2,000 employees screened",
    tagline: "Corporate wellness at municipal scale",
    description:
      "Pune Municipal Corporation pilot brought SETU preventive screening to 2,000 municipal employees in one day — demonstrating the platform's readiness for urban workforce wellness programs from SETU's Maharashtra headquarters.",
    lat: 18.52,
    lng: 73.86,
    stateId: "mh",
    image: assets.projects.pune,
    gallery: [
      assets.projects.pune,
      assets.telemedicine[1],
      assets.preventive.ehealthCenter,
    ],
    highlights: [
      "2,000 PMC employees screened in a single-day camp",
      "Urban corporate wellness model with instant digital reports",
      "Follow-up telemedicine and lab test booking via SETU app",
      "Pilot run from SETU HQ in Pune — Model Colony, Shivaji Nagar",
    ],
    services: ["Preventive Health", "Book Tests", "Telemedicine", "Fitness", "Mental Health"],
  },
]

export const projects = [
  {
    id: "sundargarh",
    title: "eSwasthya – Preventive Health Screenings",
    location: "Sundargarh, Odisha",
    year: "2024",
    stat: "30,000",
    statLabel: "Citizens Screened",
    image: assets.projects.sundargarh,
    description:
      "Free preventive health check-ups for citizens. Digitization of Matrujyoti with cloud-connected mobile app and real-time analytics.",
  },
  {
    id: "matrujyoti",
    title: "Matrujyoti",
    location: "Odisha",
    year: "2024",
    stat: "68,000",
    statLabel: "USG Conducted",
    image: assets.projects.matrujyoti,
    description:
      "Mother and child health tracking system. MDR (Mother Death Review) showed notable decrease during the Matrujyoti program.",
  },
  {
    id: "nalanda",
    title: "Preventive Health Centers",
    location: "Nalanda, Bihar",
    year: "2023",
    stat: "9,298",
    statLabel: "Citizens Screened",
    image: assets.projects.nalanda,
    description:
      "Preventive health check-ups with cloud-connected mobile health app and real-time data analytics.",
  },
  {
    id: "khatima",
    title: "Preventive Checkups",
    location: "Khatima, Uttarakhand",
    year: "2024",
    stat: "1,000",
    statLabel: "In One Day",
    image: assets.projects.khatima,
    description: "All preventive checkups completed in a single day for local citizens.",
  },
  {
    id: "pune",
    title: "PMC Pilot Project",
    location: "Pune, Maharashtra",
    year: "2024",
    stat: "2,000",
    statLabel: "Employees Screened",
    image: assets.projects.pune,
    description: "Preventive health check-up camp for Pune Municipal Corporation employees in a single day.",
  },
]

export const timeline = [
  { year: "2023", title: "Nalanda Pilot", detail: "9,298 citizens screened across preventive health centers in Bihar." },
  { year: "2024", title: "eSwasthya Launch", detail: "30,000 citizens screened in Sundargarh, Odisha with real-time analytics." },
  { year: "2024", title: "Matrujyoti Scale-up", detail: "68,000 USG conducted with measurable MDR reduction." },
  { year: "2024", title: "Multi-State Camps", detail: "Single-day camps in Khatima and Pune serving thousands." },
]

export const beliefs = [
  "Because health should be proactive.",
  "Because prevention saves lives.",
  "Because every life matters.",
]

export const contactInfo = {
  email: "support@setuai.com",
  phone: "+91 9272439392",
  address: "1073, Bhosale Mystiqa, Model Colony, Shivaji Nagar, Pune, Maharashtra 411016",
}
