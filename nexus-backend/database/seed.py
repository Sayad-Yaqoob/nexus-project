import asyncio
import json
from sqlalchemy import select
from database.connection import AsyncSessionLocal, init_db
from database.models import User, ExpertProfile, Offering

MOCK_EXPERTS = [
    # AI & DATA (5)
    {
        "full_name": "Dr. Sophia Chen",
        "email": "sophia.chen@example.com",
        "handle": "sophiachen_ai",
        "category": "AI & Data",
        "headline": "Principal AI Researcher & Large Language Model Specialist",
        "bio": "Dr. Sophia Chen has over 12 years of experience leading artificial intelligence research and engineering at top-tier Silicon Valley labs. She specializes in fine-tuning foundation models, retrieval-augmented generation (RAG) architectures, and deploying cost-effective LLM pipelines for enterprise clients.\n\nSophia holds a PhD in Computer Science from Stanford University and has published 20+ peer-reviewed papers on neural network optimization. Her recent focus is helping startups build custom AI agents that deliver high reasoning performance while cutting API operational costs by up to 70%.",
        "tags": "LLMs, RAG, PyTorch, Fine-Tuning, LangChain, Vector Databases, Python, AI Agents",
        "is_verified": True,
        "timezone": "America/Los_Angeles",
        "currency": "USD",
        "offerings": [
            {"title": "1:1 AI Architecture & RAG Review", "type": "1:1 Session", "price": 350, "duration": "60 min", "description": "Deep-dive architecture review of your LLM application, vector store indexing, and RAG retrieval accuracy optimization."},
            {"title": "Enterprise LLM Optimization Playbook", "type": "Digital Product", "price": 199, "duration": "N/A", "description": "Comprehensive guide & reference code for quantizing, caching, and deploying Llama & Mixtral models in production.", "file_required": True, "file_path": "uploads/llm_playbook.pdf", "file_placeholder_valid": True},
            {"title": "Monthly AI Tech Lead Advisory", "type": "Subscription", "price": 1200, "duration": "Monthly", "description": "Bi-weekly strategy calls + Slack support for your AI development team."}
        ]
    },
    {
        "full_name": "Marcus Vance",
        "email": "marcus.vance@example.com",
        "handle": "marcus_data",
        "category": "AI & Data",
        "headline": "Senior Data Infrastructure Lead & Snowflake Architect",
        "bio": "Marcus is a veteran data architect with 10+ years of experience designing real-time data pipelines, data warehouses, and analytics platforms for Fortune 500 companies.\n\nHe has migrated over 40 enterprise legacy databases to modern cloud data stacks (Snowflake, Databricks, dbt). Marcus works closely with data teams to eliminate data silos and build scalable ETL/ELT data pipelines.",
        "tags": "Snowflake, Databricks, dbt, SQL, Data Engineering, Python, ETL, BigQuery",
        "is_verified": True,
        "timezone": "America/New_York",
        "currency": "USD",
        "offerings": [
            {"title": "Data Pipeline & Infrastructure Audit", "type": "1:1 Session", "price": 250, "duration": "60 min", "description": "Audit your data warehouse schema, dbt data models, and query performance to reduce Snowflake query costs."},
            {"title": "Modern Data Stack Setup Blueprint", "type": "Digital Product", "price": 149, "duration": "N/A", "description": "Production Terraform templates & dbt setups for Snowflake and Databricks.", "file_required": True, "file_path": "uploads/data_stack_blueprint.zip", "file_placeholder_valid": True}
        ]
    },
    {
        "full_name": "Elena Rostova",
        "email": "elena.rostova@example.com",
        "handle": "elena_cv",
        "category": "AI & Data",
        "headline": "Computer Vision & Edge AI Systems Specialist",
        "bio": "Elena has spent 8 years deploying computer vision models on edge hardware (NVIDIA Jetson, Raspberry Pi, iOS CoreML). She has worked across robotics, automated inspection, and smart city surveillance.\n\nElena helps clients train lightweight YOLO and OpenCV models that run at 60+ FPS on constrained hardware without sacrificing detection accuracy.",
        "tags": "Computer Vision, OpenCV, YOLO, Edge AI, PyTorch, TensorRT, CoreML, C++",
        "is_verified": False,
        "timezone": "Europe/Moscow",
        "currency": "USD",
        "offerings": [
            {"title": "Edge CV Model Optimization Session", "type": "1:1 Session", "price": 200, "duration": "60 min", "description": "Troubleshoot frame rate issues, model quantization, and TensorRT compilation for edge hardware deployment."}
        ]
    },
    {
        "full_name": "Dr. Aris Thorne",
        "email": "aris.thorne@example.com",
        "handle": "aris_mops",
        "category": "AI & Data",
        "headline": "MLOps Architect & Kubernetes ML Systems Lead",
        "bio": "Dr. Aris Thorne specializes in bridging the gap between machine learning research and enterprise production deployments. He leads MLOps transformations using Kubeflow, MLflow, and automated model monitoring tools.\n\nWith extensive experience in automated CI/CD pipelines for ML models, Aris ensures model retrain loops, drift detection, and automated rollback mechanisms are bulletproof.",
        "tags": "MLOps, Kubernetes, Kubeflow, MLflow, Docker, CI/CD, Python, Monitoring",
        "is_verified": True,
        "timezone": "Europe/London",
        "currency": "GBP",
        "offerings": [
            {"title": "MLOps Pipeline Architecture Design", "type": "1:1 Session", "price": 300, "duration": "60 min", "description": "Design an enterprise-ready MLOps deployment strategy with automated drift detection and monitoring."},
            {"title": "Complete MLOps Infrastructure Starter Pack", "type": "Digital Product", "price": 299, "duration": "N/A", "description": "Docker-compose and Kubernetes manifest templates for Kubeflow & MLflow setups.", "file_required": True, "file_path": "uploads/mlops_starter.zip", "file_placeholder_valid": True}
        ]
    },
    {
        "full_name": "Priya Sharma",
        "email": "priya.sharma@example.com",
        "handle": "priya_analytics",
        "category": "AI & Data",
        "headline": "Predictive Analytics & Customer Insights Consultant",
        "bio": "Priya is a data scientist specializing in churn prediction, customer lifetime value (CLV) modeling, and market basket analysis for SaaS and e-commerce companies.\n\nShe translates complex machine learning model outputs into actionable business dashboards and automated retention strategies that drive revenue growth.",
        "tags": "Predictive Analytics, Customer Lifetime Value, Churn Modeling, Python, R, Tableau, SQL",
        "is_verified": False,
        "timezone": "Asia/Kolkata",
        "currency": "INR",
        "offerings": [
            {"title": "SaaS Churn & CLV Modeling Consultation", "type": "1:1 Session", "price": 180, "duration": "60 min", "description": "Evaluate customer data schemas and build predictive churn prevention algorithms."}
        ]
    },

    # SOFTWARE DEVELOPMENT (5)
    {
        "full_name": "Alexandre Dubois",
        "email": "alex.dubois@example.com",
        "handle": "alex_fullstack",
        "category": "Software Development",
        "headline": "Staff Full Stack Engineer (Next.js, Node.js, Python, PostgreSQL)",
        "bio": "Alexandre is a Staff Full Stack Engineer with 11 years of experience building high-scale web platforms handling millions of daily active users. He excels at modern web performance, serverless architectures, and micro-frontend design.\n\nAlexandre has guided tech leads at hyper-growth startups through monolith-to-microservices refactoring, serverless API design, and database query optimization.",
        "tags": "Next.js, TypeScript, Node.js, Python, FastAPI, PostgreSQL, GraphQL, AWS",
        "is_verified": True,
        "timezone": "Europe/Paris",
        "currency": "EUR",
        "offerings": [
            {"title": "Full-Stack Code Architecture Review", "type": "1:1 Session", "price": 250, "duration": "60 min", "description": "Comprehensive review of your Next.js frontend or Node/Python backend code for scalability and security."},
            {"title": "Production Next.js 14 SaaS Boilerplate", "type": "Digital Product", "price": 149, "duration": "N/A", "description": "Full-featured SaaS template with authentication, Stripe billing, and dark mode.", "file_required": True, "file_path": "uploads/saas_boilerplate.zip", "file_placeholder_valid": True}
        ]
    },
    {
        "full_name": "Kaito Tanaka",
        "email": "kaito.tanaka@example.com",
        "handle": "kaito_cloud",
        "category": "Software Development",
        "headline": "AWS Certified Solutions Architect & DevOps Specialist",
        "bio": "Kaito is an AWS Solutions Architect with deep expertise in Terraform, Kubernetes (EKS), serverless computing, and Cloud Security. He has designed resilient cloud infrastructure for fintech and healthcare platforms.\n\nHe focuses on cost optimization, automated infrastructure provision, and establishing Zero Trust cloud security policies.",
        "tags": "AWS, Terraform, Kubernetes, Docker, CI/CD, DevOps, Serverless, Cloud Security",
        "is_verified": True,
        "timezone": "Asia/Tokyo",
        "currency": "JPY",
        "offerings": [
            {"title": "AWS Cloud Infrastructure & Cost Audit", "type": "1:1 Session", "price": 280, "duration": "60 min", "description": "Analyze your AWS architecture, security groups, and monthly bill to identify cost reductions up to 40%."}
        ]
    },
    {
        "full_name": "Jessica Miller",
        "email": "jessica.miller@example.com",
        "handle": "jess_mobile",
        "category": "Software Development",
        "headline": "Lead Mobile Architect (Flutter & React Native)",
        "bio": "Jessica has built and published 15+ cross-platform mobile apps for iOS and Android. She specializes in Flutter state management (Bloc, Provider), offline-first sync, and smooth 60fps animations.\n\nJessica regularly consults with engineering managers who need to speed up mobile release cycles or fix tricky performance bottlenecks on low-end Android devices.",
        "tags": "Flutter, React Native, iOS, Android, Dart, Mobile Security, Firebase, GraphQL",
        "is_verified": True,
        "timezone": "America/Chicago",
        "currency": "USD",
        "offerings": [
            {"title": "Flutter / Mobile App Performance Sprint", "type": "1:1 Session", "price": 200, "duration": "60 min", "description": "Debug render lag, memory leaks, and native bridge integration issues in Flutter or React Native."}
        ]
    },
    {
        "full_name": "Viktor Kowalski",
        "email": "viktor.kowalski@example.com",
        "handle": "viktor_rust",
        "category": "Software Development",
        "headline": "Systems Programmer (Rust, C++, High-Performance Computing)",
        "bio": "Viktor is a low-level systems programmer with a passion for memory safety, concurrency, and high-frequency data processing. He built core distributed systems components for fintech trading platforms.\n\nViktor aids teams transitioning critical performance bottlenecks from Python/Node to WebAssembly or native Rust microservices.",
        "tags": "Rust, C++, WebAssembly, Concurrency, High Performance, Distributed Systems, gRPC",
        "is_verified": False,
        "timezone": "Europe/Warsaw",
        "currency": "PLN",
        "offerings": [
            {"title": "Rust Systems & Microservice Advisory", "type": "1:1 Session", "price": 275, "duration": "60 min", "description": "Architecture planning for converting bottleneck microservices into high-throughput Rust services."}
        ]
    },
    {
        "full_name": "Rachel Adams",
        "email": "rachel.adams@example.com",
        "handle": "rachel_sec",
        "category": "Software Development",
        "headline": "Application Security Lead & Ethical Hacker",
        "bio": "Rachel is a cybersecurity researcher and appsec specialist with a background in penetration testing, OWASP compliance, and secure API design. She has conducted 100+ application security assessments.\n\nShe helps software teams identify vulnerabilities, fix auth loopholes, and implement robust encryption standards before public launch.",
        "tags": "Cybersecurity, AppSec, OWASP, Penetration Testing, OAuth2, Cryptography, Security Auditing",
        "is_verified": True,
        "timezone": "America/New_York",
        "currency": "USD",
        "offerings": [
            {"title": "API & Web Application Security Audit", "type": "1:1 Session", "price": 350, "duration": "60 min", "description": "Review API endpoints, authentication flows, and security headers against OWASP Top 10 guidelines."},
            {"title": "DevSecOps Security Implementation Guide", "type": "Digital Product", "price": 199, "duration": "N/A", "description": "Automated security scanning templates for GitHub Actions and GitLab CI.", "file_required": True, "file_path": "uploads/devsecops_guide.pdf", "file_placeholder_valid": True}
        ]
    },

    # BUSINESS & STRATEGY (4)
    {
        "full_name": "David Sterling",
        "email": "david.sterling@example.com",
        "handle": "david_venture",
        "category": "Business & Strategy",
        "headline": "Former Tech Founder & Venture Capital Advisor",
        "bio": "David Sterling has co-founded two tech startups that achieved successful acquisitions ($50M+ total exit value) and now serves as an advisor to pre-seed and Series A founders.\n\nDavid provides strategic guidance on pitch deck refinement, go-to-market execution, valuation metrics, and navigating investor negotiations during fundraising rounds.",
        "tags": "Fundraising, Venture Capital, Pitch Decks, SaaS Strategy, GTM Strategy, Startup Scaling",
        "is_verified": True,
        "timezone": "America/New_York",
        "currency": "USD",
        "offerings": [
            {"title": "Pitch Deck & Fundraising Strategy Clinic", "type": "1:1 Session", "price": 400, "duration": "60 min", "description": "Line-by-line review of your investor pitch deck, financial model assumptions, and term sheet prep."},
            {"title": "The Ultimate VC Pitch & Financial Modeling Toolkit", "type": "Digital Product", "price": 249, "duration": "N/A", "description": "Battle-tested pitch deck templates, financial projections Excel model, and investor cap table calculator.", "file_required": True, "file_path": "uploads/vc_toolkit.zip", "file_placeholder_valid": True}
        ]
    },
    {
        "full_name": "Amara Okafor",
        "email": "amara.okafor@example.com",
        "handle": "amara_strategy",
        "category": "Business & Strategy",
        "headline": "SaaS Monetization & Pricing Strategy Strategist",
        "bio": "Amara has spent 9 years optimizing pricing strategy and business models for B2B SaaS platforms. She previously managed monetization strategy at a unicorn software startup.\n\nShe specializes in usage-based pricing models, value metric identification, tiered feature packaging, and enterprise sales contract structures.",
        "tags": "SaaS Pricing, Business Models, Monetization, B2B SaaS, Revenue Growth, Packaging",
        "is_verified": True,
        "timezone": "Africa/Lagos",
        "currency": "USD",
        "offerings": [
            {"title": "SaaS Pricing & Packaging Strategy Session", "type": "1:1 Session", "price": 300, "duration": "60 min", "description": "Analyze your current pricing tiers, user conversion funnels, and design higher-margin pricing plans."}
        ]
    },
    {
        "full_name": "Robert Vance Jr.",
        "email": "robert.vance@example.com",
        "handle": "robert_ops",
        "category": "Business & Strategy",
        "headline": "M&A Integration & Corporate Growth Specialist",
        "bio": "Robert brings 15+ years of corporate strategy experience advising middle-market software firms on mergers, acquisitions, and post-merger integration challenges.\n\nHe supports founders through buy-side due diligence, financial audit readiness, and operational synergy realization.",
        "tags": "M&A, Corporate Strategy, Due Diligence, Financial Analysis, Business Valuation",
        "is_verified": False,
        "timezone": "America/Chicago",
        "currency": "USD",
        "offerings": [
            {"title": "Exit Readiness & Due Diligence Advisory", "type": "1:1 Session", "price": 450, "duration": "60 min", "description": "Prepare your company financial records, data room, and cap table for acquisition or merger discussions."}
        ]
    },
    {
        "full_name": "Carlos Gomez",
        "email": "carlos.gomez@example.com",
        "handle": "carlos_bizdev",
        "category": "Business & Strategy",
        "headline": "International Expansion & Partnership Strategist",
        "bio": "Carlos helps fast-growing tech platforms expand into LATAM and European markets through localized partnerships, regulatory alignment, and regional distribution networks.\n\nHe has closed multi-million-dollar strategic alliances between regional technology distributors and global software vendors.",
        "tags": "Global Expansion, Strategic Partnerships, LATAM Tech, Business Development, Channel Sales",
        "is_verified": True,
        "timezone": "America/Mexico_City",
        "currency": "MXN",
        "offerings": [
            {"title": "International Market Entry Strategy Session", "type": "1:1 Session", "price": 250, "duration": "60 min", "description": "Evaluate target regional markets, partner profiles, and localization requirements."}
        ]
    },

    # MARKETING & GROWTH (4)
    {
        "full_name": "Chloe Bennett",
        "email": "chloe.bennett@example.com",
        "handle": "chloe_growth",
        "category": "Marketing & Growth",
        "headline": "Growth Marketing Director & Paid Acquisition Expert",
        "bio": "Chloe Bennett is a data-driven growth marketer who has scaled paid customer acquisition channels (Google Ads, Meta, LinkedIn) for startups from $10k/mo to $500k/mo in ad spend profitability.\n\nShe specializes in multi-touch attribution, ad creative testing frameworks, landing page CRO, and reducing customer acquisition cost (CAC).",
        "tags": "Growth Marketing, Paid Ads, Google Ads, Meta Ads, CRO, CAC Reduction, Attribution",
        "is_verified": True,
        "timezone": "America/Los_Angeles",
        "currency": "USD",
        "offerings": [
            {"title": "Paid Ad Campaign & Funnel Audit", "type": "1:1 Session", "price": 220, "duration": "60 min", "description": "Audit ad account setups, conversion tracking, and landing pages to lower CAC and raise ROAS."},
            {"title": "High-ROAS Ad Copy & Creative Blueprint", "type": "Digital Product", "price": 99, "duration": "N/A", "description": "Templates and framework for high-converting social and search ad creatives.", "file_required": True, "file_path": "uploads/ad_creative_blueprint.pdf", "file_placeholder_valid": True}
        ]
    },
    {
        "full_name": "Tariq Al-Mansoor",
        "email": "tariq.almansoor@example.com",
        "handle": "tariq_seo",
        "category": "Marketing & Growth",
        "headline": "Technical SEO Architect & Organic Growth Specialist",
        "bio": "Tariq has 10 years of technical SEO experience optimizing enterprise platforms with millions of indexed pages. He has driven organic traffic growth of over 400% for top content sites.\n\nTariq specializes in Core Web Vitals, programmatic SEO content engines, schema structured data, and international hreflang site structures.",
        "tags": "SEO, Technical SEO, Programmatic SEO, Core Web Vitals, Schema, Content Strategy",
        "is_verified": True,
        "timezone": "Asia/Dubai",
        "currency": "AED",
        "offerings": [
            {"title": "Technical SEO & Site Architecture Audit", "type": "1:1 Session", "price": 225, "duration": "60 min", "description": "Diagnose indexing issues, JavaScript rendering bottlenecks, and programmatic SEO opportunities."}
        ]
    },
    {
        "full_name": "Emily Watson",
        "email": "emily.watson@example.com",
        "handle": "emily_content",
        "category": "Marketing & Growth",
        "headline": "B2B Content Strategy & Thought Leadership Strategist",
        "bio": "Emily helps B2B SaaS startups build high-converting content marketing engines and founder thought leadership programs on LinkedIn and X.\n\nShe turns complex engineering ideas into compelling whitepapers, case studies, and viral content campaigns that generate qualified enterprise leads.",
        "tags": "Content Strategy, Copywriting, B2B Marketing, Thought Leadership, Lead Generation",
        "is_verified": False,
        "timezone": "Europe/London",
        "currency": "GBP",
        "offerings": [
            {"title": "B2B Content Engine & Messaging Clinic", "type": "1:1 Session", "price": 160, "duration": "60 min", "description": "Define target buyer personas, content calendars, and brand positioning messaging."}
        ]
    },
    {
        "full_name": "Liam O'Connor",
        "email": "liam.oconnor@example.com",
        "handle": "liam_plg",
        "category": "Marketing & Growth",
        "headline": "Product-Led Growth (PLG) & Onboarding Funnel Specialist",
        "bio": "Liam specializes in Product-Led Growth (PLG) mechanics, freemium-to-paid conversion optimization, and user onboarding friction reduction.\n\nHe has helped SaaS products increase free-trial activation rates by up to 50% by optimizing product tours, contextual nudges, and lifecycle email sequences.",
        "tags": "PLG, User Onboarding, Conversion Rate Optimization, SaaS Growth, Mixpanel, Amplitude",
        "is_verified": True,
        "timezone": "Europe/Dublin",
        "currency": "EUR",
        "offerings": [
            {"title": "PLG User Onboarding & Activation Tear-down", "type": "1:1 Session", "price": 250, "duration": "60 min", "description": "Review product registration flow and first-mile user experience to maximize activation."}
        ]
    },

    # SALES (3)
    {
        "full_name": "Marcus Sterling",
        "email": "marcus.sterling.sales@example.com",
        "handle": "marcus_sales",
        "category": "Sales",
        "headline": "Enterprise B2B Sales Leader & Outbound Pipeline Strategist",
        "bio": "Marcus is a former VP of Sales who built enterprise sales engines closing $100k+ ACV contracts with Fortune 500 clients. He has trained over 200 account executives and SDRs.\n\nMarcus coaches founders and sales leaders on outbound cold email messaging, MEDDPICC deal qualification, objection handling, and enterprise contract negotiation.",
        "tags": "B2B Sales, Enterprise Sales, Outbound Lead Gen, MEDDPICC, Sales Coaching, CRM",
        "is_verified": True,
        "timezone": "America/New_York",
        "currency": "USD",
        "offerings": [
            {"title": "Enterprise Sales Process & Deal Coaching", "type": "1:1 Session", "price": 300, "duration": "60 min", "description": "Review active sales deal pipelines, cold outreach playbooks, and contract closing strategies."},
            {"title": "B2B Enterprise Sales Playbook & Cold Email Templates", "type": "Digital Product", "price": 179, "duration": "N/A", "description": "Outbound email sequences, objection handling scripts, and MEDDPICC qualification frameworks.", "file_required": True, "file_path": "uploads/sales_playbook.pdf", "file_placeholder_valid": True}
        ]
    },
    {
        "full_name": "Nadia Hussain",
        "email": "nadia.hussain@example.com",
        "handle": "nadia_revops",
        "category": "Sales",
        "headline": "Revenue Operations (RevOps) & Salesforce Architect",
        "bio": "Nadia aligns sales, marketing, and customer success tech stacks to eliminate revenue leaks. She is a certified Salesforce Architect and HubSpot RevOps Master.\n\nShe designs automated sales pipelines, territory assignment rules, and executive revenue dashboards that give total visibility into deal velocity.",
        "tags": "RevOps, Salesforce, HubSpot, Revenue Architecture, Sales Operations, Automation",
        "is_verified": True,
        "timezone": "Asia/Karachi",
        "currency": "PKR",
        "offerings": [
            {"title": "RevOps Tech Stack & CRM Architecture Review", "type": "1:1 Session", "price": 250, "duration": "60 min", "description": "Audit Salesforce/HubSpot setup, lead scoring rules, and automated workflow triggers."}
        ]
    },
    {
        "full_name": "Jason Meyer",
        "email": "jason.meyer@example.com",
        "handle": "jason_closing",
        "category": "Sales",
        "headline": "High-Ticket Sales Closer & Pipeline Acceleration Specialist",
        "bio": "Jason has personally closed over $25M in high-ticket consulting and software contracts. He works with agency owners and high-end service providers to increase close rates on discovery calls.\n\nHe focuses on discovery call questioning techniques, pitch presentation polish, and non-pushy closing frameworks.",
        "tags": "High-Ticket Sales, Closing, Sales Pitch, Discovery Calls, Objection Handling",
        "is_verified": False,
        "timezone": "America/Denver",
        "currency": "USD",
        "offerings": [
            {"title": "Discovery & Closing Call Live Mock Session", "type": "1:1 Session", "price": 200, "duration": "60 min", "description": "Roleplay sales calls, receive instant feedback, and learn non-pushy objection handling."}
        ]
    },

    # FINANCE & INVESTING (3)
    {
        "full_name": "Victoria Thorne",
        "email": "victoria.thorne@example.com",
        "handle": "victoria_cfo",
        "category": "Finance & Investing",
        "headline": "Fractional CFO for High-Growth Tech & SaaS Companies",
        "bio": "Victoria is a CPA and former Investment Banker with 14 years of experience as a Fractional CFO for high-growth tech companies. She manages cash flow modeling, capital allocation, and audit readiness.\n\nVictoria helps startups establish key financial unit economics (LTV/CAC, gross margins, net burn rate) to maintain financial runway and prepare for venture rounds.",
        "tags": "Fractional CFO, Financial Modeling, Cash Flow Management, SaaS Metrics, Valuation, Accounting",
        "is_verified": True,
        "timezone": "America/New_York",
        "currency": "USD",
        "offerings": [
            {"title": "Financial Model & Runway Review", "type": "1:1 Session", "price": 350, "duration": "60 min", "description": "Evaluate 3-statement financial model, burn rate forecast, and unit economics health."},
            {"title": "SaaS Financial Projections Excel Master Model", "type": "Digital Product", "price": 199, "duration": "N/A", "description": "Fully dynamic financial model with cohort analysis and revenue forecasting.", "file_required": True, "file_path": "uploads/saas_financial_model.xlsx", "file_placeholder_valid": True}
        ]
    },
    {
        "full_name": "Henrik Lindqvist",
        "email": "henrik.lindqvist@example.com",
        "handle": "henrik_mna",
        "category": "Finance & Investing",
        "headline": "Crypto & Fintech Financial Regulatory Advisor",
        "bio": "Henrik advises fintech and Web3 platforms on international financial regulation, anti-money laundering (AML/KYC) compliance, and cross-border payment rails.\n\nHe has worked with central bank sandbox initiatives and institutional liquidity providers across Europe and Asia.",
        "tags": "Fintech, Web3, Compliance, AML, KYC, Financial Regulation, Payments",
        "is_verified": False,
        "timezone": "Europe/Stockholm",
        "currency": "SEK",
        "offerings": [
            {"title": "Fintech & Payment Regulatory Strategy Call", "type": "1:1 Session", "price": 300, "duration": "60 min", "description": "Review regulatory compliance guidelines, licensing requirements, and banking partner setups."}
        ]
    },
    {
        "full_name": "Samantha Wu",
        "email": "samantha.wu@example.com",
        "handle": "samantha_tax",
        "category": "Finance & Investing",
        "headline": "International Corporate Tax & R&D Credit Strategist",
        "bio": "Samantha helps tech companies leverage federal and state R&D tax credits, software capitalization rules, and cross-border tax structures legally to maximize retained earnings.\n\nShe has saved software startups millions of dollars in tax liabilities by structuring R&D tax credit claims correctly.",
        "tags": "Tax Strategy, R&D Tax Credits, Accounting, Corporate Tax, Startup Finance",
        "is_verified": True,
        "timezone": "America/Los_Angeles",
        "currency": "USD",
        "offerings": [
            {"title": "Software R&D Tax Credit Strategy Session", "type": "1:1 Session", "price": 250, "duration": "60 min", "description": "Identify eligible software engineering expenses and prepare R&D tax credit documentation."}
        ]
    },

    # OPERATIONS & SUPPLY CHAIN (2)
    {
        "full_name": "Gavin MacLeod",
        "email": "gavin.macleod@example.com",
        "handle": "gavin_ops",
        "category": "Operations & Supply Chain",
        "headline": "Global Supply Chain & E-Commerce Logistics Director",
        "bio": "Gavin has managed end-to-end supply chains for multi-million-dollar direct-to-consumer (DTC) brands and hardware startups. He specializes in overseas manufacturing contracts, 3PL selection, and customs optimization.\n\nHe reduces inventory carrying costs, mitigates supply chain disruption risks, and negotiates favorable freight agreements.",
        "tags": "Supply Chain, Freight, Logistics, 3PL, E-Commerce Operations, Manufacturing",
        "is_verified": True,
        "timezone": "Europe/London",
        "currency": "GBP",
        "offerings": [
            {"title": "Supply Chain & 3PL Logistics Audit", "type": "1:1 Session", "price": 260, "duration": "60 min", "description": "Review supplier terms, 3PL fulfillment costs, and inventory forecasting accuracy."}
        ]
    },
    {
        "full_name": "Leila Al-Sabah",
        "email": "leila.alsabah@example.com",
        "handle": "leila_lean",
        "category": "Operations & Supply Chain",
        "headline": "Six Sigma Black Belt & Process Automation Lead",
        "bio": "Leila helps operational teams eliminate workflow friction using Lean Six Sigma principles and modern no-code automation platforms (Zapier, Make, custom Python scripts).\n\nShe has re-engineered operational workflows for healthcare, logistics, and legal services, saving thousands of manual labor hours per quarter.",
        "tags": "Six Sigma, Process Automation, Lean Operations, Zapier, Make, Workflow Design",
        "is_verified": True,
        "timezone": "Asia/Dubai",
        "currency": "AED",
        "offerings": [
            {"title": "Business Process Mapping & Automation Clinic", "type": "1:1 Session", "price": 200, "duration": "60 min", "description": "Map internal workflows and build automated no-code integrations for manual tasks."}
        ]
    },

    # COACHING & LEADERSHIP (2)
    {
        "full_name": "Dr. Arthur Pendelton",
        "email": "arthur.pendelton@example.com",
        "handle": "arthur_exec",
        "category": "Coaching & Leadership",
        "headline": "Executive Leadership Coach & Organizational Psychologist",
        "bio": "Dr. Pendelton has spent 20 years coaching CEO founders, VP leaders, and board members on high-stakes decision making, conflict resolution, and scaling company culture.\n\nHe holds a PhD in Organizational Psychology and utilizes evidence-based executive coaching frameworks to build resilient leadership teams.",
        "tags": "Executive Coaching, Leadership Development, Organizational Psychology, Team Culture",
        "is_verified": True,
        "timezone": "America/New_York",
        "currency": "USD",
        "offerings": [
            {"title": "1:1 Executive Leadership Strategy Session", "type": "1:1 Session", "price": 400, "duration": "60 min", "description": "Private leadership consultation on executive presence, team management, or founder burnout."}
        ]
    },
    {
        "full_name": "Maria Santos",
        "email": "maria.santos@example.com",
        "handle": "maria_agile",
        "category": "Coaching & Leadership",
        "headline": "Agile Enterprise Coach & Engineering Team Mentor",
        "bio": "Maria transforms dysfunctional engineering teams into high-velocity, self-organizing units. She has led Scrum and Kanban transformations across remote distributed teams.\n\nMaria focuses on sprint planning efficiency, psychological safety in engineering teams, and eliminating blocker dependencies.",
        "tags": "Agile Coaching, Scrum, Kanban, Engineering Leadership, Remote Team Management",
        "is_verified": False,
        "timezone": "America/Sao_Paulo",
        "currency": "BRL",
        "offerings": [
            {"title": "Agile Sprint & Engineering Velocity Advisory", "type": "1:1 Session", "price": 190, "duration": "60 min", "description": "Evaluate sprint retrospective feedback, sprint velocity metrics, and team alignment."}
        ]
    },

    # SCIENCE & ENVIRONMENT (1)
    {
        "full_name": "Dr. Lars Lindemann",
        "email": "lars.lindemann@example.com",
        "handle": "lars_climate",
        "category": "Science & Environment",
        "headline": "Climate Tech & ESG Carbon Accounting Specialist",
        "bio": "Dr. Lindemann advises clean-tech startups and enterprise corporations on Life Cycle Assessments (LCA), ESG compliance reporting, and carbon credit validation standards.\n\nHe has assisted energy and hardware startups in securing green technology grants and venture investment by validating their carbon reduction metrics.",
        "tags": "Climate Tech, ESG, Carbon Accounting, Sustainability, LCA, Renewable Energy",
        "is_verified": True,
        "timezone": "Europe/Berlin",
        "currency": "EUR",
        "offerings": [
            {"title": "Climate Tech ESG & Carbon Impact Validation", "type": "1:1 Session", "price": 275, "duration": "60 min", "description": "Review product life cycle carbon impact assessment and ESG regulatory compliance documentation."}
        ]
    },

    # PERSONAL DEVELOPMENT (1)
    {
        "full_name": "Seraphina Vance",
        "email": "seraphina.vance@example.com",
        "handle": "seraphina_mindset",
        "category": "Personal Development",
        "headline": "High-Performance Peak Mindset & Productivity Specialist",
        "bio": "Seraphina works with high-achieving founders, investors, and elite performers to optimize cognitive focus, stress resilience, and daily routine productivity.\n\nBlending neuroscience techniques with behavioral habit design, she helps leaders break through burnout barriers and achieve peak sustained performance.",
        "tags": "Peak Performance, Mindset, Productivity, Habits, Focus, Stress Resilience",
        "is_verified": True,
        "timezone": "America/New_York",
        "currency": "USD",
        "offerings": [
            {"title": "Peak Performance & Habit Architecture Session", "type": "1:1 Session", "price": 180, "duration": "60 min", "description": "Build a personalized daily focus routine, time-blocking system, and cognitive energy strategy."}
        ]
    }
]

# Realistic client users for demo authentication
MOCK_CLIENTS = [
    {
        "full_name": "Sarah Ahmed",
        "email": "sarah.ahmed@techventures.io",
        "handle": "sarah_ahmed",
        "currency": "USD",
    },
    {
        "full_name": "James Chen",
        "email": "james.chen@innovatecorp.com",
        "handle": "james_chen",
        "currency": "USD",
    },
    {
        "full_name": "Fatima Al-Rashidi",
        "email": "fatima@startupgulf.ae",
        "handle": "fatima_rashidi",
        "currency": "AED",
    },
    {
        "full_name": "Daniel Okonkwo",
        "email": "daniel.okonkwo@afrotechscale.ng",
        "handle": "daniel_okonkwo",
        "currency": "USD",
    },
    {
        "full_name": "Anna Petrov",
        "email": "anna.petrov@eurostartups.de",
        "handle": "anna_petrov",
        "currency": "EUR",
    },
    {
        "full_name": "Ryan Nakamura",
        "email": "ryan@pacificventures.co",
        "handle": "ryan_nakamura",
        "currency": "USD",
    },
    {
        "full_name": "Isabela Costa",
        "email": "isabela.costa@latamtech.br",
        "handle": "isabela_costa",
        "currency": "BRL",
    },
    {
        "full_name": "Omar Youssef",
        "email": "omar.youssef@menahub.sa",
        "handle": "omar_youssef",
        "currency": "SAR",
    },
]


async def seed_database():
    """Seed the database with realistic expert and client profiles if database is empty."""
    await init_db()

    async with AsyncSessionLocal() as session:
        # Check if users already exist
        result = await session.execute(select(User))
        existing_users = result.scalars().all()

        if existing_users:
            print(f"[SEED] Database already populated with {len(existing_users)} users. Skipping seed.")
            return

        print(f"[SEED] Seeding {len(MOCK_EXPERTS)} expert profiles across 10 categories...")

        for data in MOCK_EXPERTS:
            user = User(
                email=data["email"],
                full_name=data["full_name"],
                role="expert",
                public_handle=data["handle"],
                currency=data.get("currency", "USD"),
            )
            session.add(user)
            await session.flush()

            profile = ExpertProfile(
                user_id=user.id,
                bio=data["bio"],
                professional_headline=data["headline"],
                expertise_tags=data["tags"],
                category=data["category"],
                currency=data.get("currency", "USD"),
                linkedin_url=f"https://linkedin.com/in/{data['handle']}",
                x_url=f"https://x.com/{data['handle']}",
                timezone=data.get("timezone", "UTC"),
                session_duration_default=60,
                buffer_between_sessions=15,
                is_verified=data["is_verified"],
            )
            session.add(profile)
            await session.flush()

            for off in data["offerings"]:
                offering = Offering(
                    expert_id=profile.id,
                    offer_type=off["type"],
                    title=off["title"],
                    price=off["price"],
                    duration=off.get("duration", "60 min"),
                    description=off.get("description", ""),
                    file_required=off.get("file_required", False),
                    file_path=off.get("file_path", None),
                    file_placeholder_valid=off.get("file_placeholder_valid", False),
                    active_listing=True,
                )
                session.add(offering)

        # Seed client users
        print(f"[SEED] Seeding {len(MOCK_CLIENTS)} client users...")
        for data in MOCK_CLIENTS:
            client_user = User(
                email=data["email"],
                full_name=data["full_name"],
                role="client",
                public_handle=data["handle"],
                currency=data.get("currency", "USD"),
            )
            session.add(client_user)

        await session.commit()
        print(f"[SEED] Successfully seeded database with {len(MOCK_EXPERTS)} experts and {len(MOCK_CLIENTS)} clients!")


if __name__ == "__main__":
    asyncio.run(seed_database())
