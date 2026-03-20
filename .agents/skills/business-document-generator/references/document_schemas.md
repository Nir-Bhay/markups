# Business Document Data Schemas

This document describes the JSON data structure expected for each document type.

## Proposal Document Schema

```json
{
  "title": "string - Main proposal title",
  "subtitle": "string - Subtitle or tagline",
  "client_org": "string - Client organization name",
  "client_contact": "string - Client contact person name",
  "company_name": "string - Your company name",
  "contact_info": "string - Your contact email/phone",
  "date": "string - Date in format 'Month DD, YYYY'",
  "project_name": "string - Name of the project",
  "problem": "string - Problem statement",
  "key_technology": "string - Technology or approach used",
  "key_metric": "string - Key metrics to improve",
  "timeline": "string - Project timeline",
  "budget_amount": "string - Total budget amount"
}
```

### Required Fields
- `title`
- `client_org`
- `company_name`

### Optional Fields
All other fields are optional and will use template defaults if not provided.

---

## Business Plan Document Schema

```json
{
  "company_name": "string - Your company name",
  "date": "string - Date in format 'Month DD, YYYY'",
  "mission": "string - Company mission statement",
  "vision": "string - Company vision statement",
  "legal_structure": "string - Legal entity type (LLC, Corp, etc.)",
  "business_stage": "string - Current stage (concept, startup, expansion)",
  "target_market": "string - Description of target market",
  "total_addressable_market": "string - TAM estimate"
}
```

### Required Fields
- `company_name`

### Optional Fields
All other fields are optional and will use template defaults if not provided.

---

## Budget Document Schema

```json
{
  "fiscal_year": "string - Year (YYYY)",
  "company_name": "string - Your company name",
  "date": "string - Date in format 'Month DD, YYYY'",
  "inflation_rate": "string - Expected inflation rate",
  "headcount_growth": "string - Planned hiring",
  "sales_growth_target": "string - Revenue growth target",
  "key_metrics": "string - Key business metrics"
}
```

### Required Fields
- `fiscal_year`
- `company_name`

### Optional Fields
All other fields are optional and will use template defaults if not provided.

---

## Date Format

All dates should be in the format: `"November 3, 2025"` (Full month name, day, year)

## Example Files

See the `assets/examples/` directory for complete example JSON files for each document type:
- `proposal_example.json`
- `business_plan_example.json`
- `budget_example.json`
