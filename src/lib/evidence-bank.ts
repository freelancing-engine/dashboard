type EvidenceSnippet = {
  project_name: string;
  confidence: string;
  snippet: string;
};

const EVIDENCE: Record<string, EvidenceSnippet[]> = {
  flagship: [
    {
      project_name: "Recruitment Chatbot",
      confidence: "strong",
      snippet:
        "Built a production-style recruitment chatbot demo with an AI-backed scoring workflow and clean backend/frontend separation.",
    },
    {
      project_name: "Healthcare Chatbot Platform",
      confidence: "strong",
      snippet:
        "Worked on a healthcare-focused chatbot platform involving backend services, Azure AI integrations, search/retrieval patterns, and production data systems.",
    },
    {
      project_name: "Azure Infrastructure and Delivery Automation",
      confidence: "strong",
      snippet:
        "Worked hands-on with Azure infrastructure, Terraform, CI/CD, and container-based deployment workflows in real delivery environments.",
    },
  ],
  ai_automation: [
    {
      project_name: "Recruitment Chatbot",
      confidence: "strong",
      snippet:
        "Built a full technical product with separate frontend and backend architecture. Implemented AI-assisted scoring logic through an API service.",
    },
    {
      project_name: "Healthcare Chatbot Platform",
      confidence: "strong",
      snippet:
        "Worked on a healthcare-focused chatbot platform involving backend services, Azure AI integrations, search/retrieval patterns, and production data systems.",
    },
    {
      project_name: "Data and Knowledge Graph Workflows",
      confidence: "strong",
      snippet:
        "Worked on distributed processing and graph-oriented backend systems connected to search and retrieval-style workflows.",
    },
  ],
  backend_integrations: [
    {
      project_name: "Upload App",
      confidence: "strong",
      snippet:
        "Delivered a full application workflow combining React, FastAPI, SQL-driven business rules, and Azure storage integration.",
    },
    {
      project_name: "Healthcare Chatbot Platform",
      confidence: "strong",
      snippet:
        "Contributed to AI-enabled backend systems where reliability, integration depth, and maintainability mattered.",
    },
    {
      project_name: "Data and Knowledge Graph Workflows",
      confidence: "strong",
      snippet:
        "Contributed to technically complex backend/data systems where scale and structure mattered.",
    },
  ],
  azure_devops_iac: [
    {
      project_name: "Azure Infrastructure and Delivery Automation",
      confidence: "strong",
      snippet:
        "Worked hands-on with Azure infrastructure, Terraform, CI/CD, and container-based deployment workflows in real delivery environments.",
    },
    {
      project_name: "Upload App",
      confidence: "strong",
      snippet:
        "Deployed backend services through containerized workflows and cloud pipelines. Integrated Azure storage services into the backend flow.",
    },
    {
      project_name: "Healthcare Chatbot Platform",
      confidence: "strong",
      snippet:
        "Worked on a healthcare-focused chatbot platform involving backend services, Azure AI integrations, and production data systems.",
    },
  ],
};

export function getEvidenceForAngle(
  profileAngle: string,
): EvidenceSnippet[] {
  return EVIDENCE[profileAngle] || EVIDENCE.flagship;
}
