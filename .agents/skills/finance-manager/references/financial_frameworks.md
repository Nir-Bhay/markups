# Financial Analysis Reference Guide

## Personal Finance Frameworks

### The 50/30/20 Budget Rule

A simple budgeting framework that allocates:
- **50%** - Needs (housing, utilities, groceries, transportation, insurance)
- **30%** - Wants (dining out, entertainment, shopping, hobbies)
- **20%** - Savings and debt repayment

### Key Financial Metrics

#### Savings Rate
```
Savings Rate = (Total Income - Total Expenses) / Total Income × 100
```

**Benchmarks:**
- Below 10%: Concerning, needs improvement
- 10-20%: Good, room for optimization
- 20-30%: Excellent
- Above 30%: Outstanding

#### Expense Ratio by Category

**Housing:** 25-30% of income
**Transportation:** 10-15% of income
**Food:** 10-15% of income
**Utilities:** 5-10% of income
**Healthcare:** 5-10% of income
**Entertainment:** 5-10% of income
**Savings:** Minimum 20% of income

### Cash Flow Analysis

**Positive Cash Flow:** Income > Expenses (building wealth)
**Negative Cash Flow:** Income < Expenses (depleting savings or accumulating debt)

### Financial Health Indicators

1. **Emergency Fund:** 3-6 months of expenses saved
2. **Debt-to-Income Ratio:** Should be below 36%
3. **Net Worth Growth:** Should increase month-over-month
4. **Investment Rate:** At least 15% of gross income for retirement

## Transaction Data Schema

### Standard Fields

```
Date: YYYY-MM-DD format
Description: String describing the transaction
Income: Category (Income, Food, Housing, Transportation, Utilities, Health, Shopping, etc.)
Type: Income or Expense
Amount: Float (positive for income, negative for expenses)
```

### Category Definitions

**Income Categories:**
- Salary: Regular employment income
- Freelance: Contract or gig work
- Investment: Dividends, interest, capital gains
- Business: Self-employment income
- Other: Gifts, refunds, misc

**Expense Categories:**
- Housing: Rent, mortgage, property tax, home insurance
- Food: Groceries, restaurants, cafes
- Transportation: Gas, car payments, insurance, maintenance, public transit
- Utilities: Electric, water, gas, internet, phone
- Health: Insurance, medications, doctor visits, gym
- Shopping: Clothing, electronics, household items
- Entertainment: Movies, subscriptions, hobbies
- Education: Tuition, books, courses

## Analysis Workflows

### 1. Monthly Review Process

1. **Import Data:** Extract transactions from bank statements or tracking apps
2. **Categorize:** Ensure all transactions have correct categories
3. **Calculate Totals:** Sum income and expenses by category
4. **Compare to Budget:** Check actuals vs planned spending
5. **Identify Anomalies:** Flag unusual transactions or categories over budget
6. **Generate Insights:** Create trends and recommendations

### 2. Spending Pattern Analysis

**Questions to Answer:**
- Which categories consume the most money?
- Are there recurring unnecessary expenses?
- How does spending vary by day of week or time of month?
- What percentage of income goes to fixed vs variable expenses?

### 3. Budget Optimization

**Steps:**
1. Identify top 3 expense categories
2. Look for reduction opportunities in each
3. Calculate potential savings
4. Set realistic targets
5. Track progress month-over-month

## Visualization Best Practices

### Chart Types for Financial Data

**Pie/Doughnut Charts:**
- Best for: Category breakdown of expenses
- Shows: Relative proportion of spending

**Bar Charts:**
- Best for: Comparing income vs expenses over time
- Shows: Month-over-month trends

**Line Charts:**
- Best for: Tracking net worth or savings over time
- Shows: Growth trends

**Stacked Bar Charts:**
- Best for: Showing category breakdown over multiple periods
- Shows: How spending composition changes

### Color Conventions

- **Green:** Income, positive values, on-budget
- **Red:** Expenses, negative values, over-budget
- **Blue:** Neutral information
- **Yellow/Orange:** Warnings, areas needing attention

## Recommendation Engine Logic

### Triggers for Recommendations

**High Spending in Category:**
```python
if category_percentage > threshold:
    recommend("Consider reducing [category] spending")
```

**Low Savings Rate:**
```python
if savings_rate < 10:
    recommend("Critical: Increase savings immediately")
elif savings_rate < 20:
    recommend("Aim for 20% savings rate")
```

**Unbalanced Budget:**
```python
if needs_percentage > 50:
    recommend("Housing or essential costs too high")
if wants_percentage > 30:
    recommend("Discretionary spending exceeds guidelines")
```

**Income Diversification:**
```python
if income_source_count == 1:
    recommend("Consider additional income streams")
```

## Report Components

### Executive Summary
- Total income for period
- Total expenses for period
- Net savings/loss
- Savings rate
- Key insight (1 sentence takeaway)

### Detailed Breakdown
- Income by source
- Expenses by category (with percentages)
- Top 5 largest transactions
- Comparison to previous period

### Trends & Patterns
- Month-over-month changes
- Category trends
- Spending habits (day of week, time patterns)

### Actionable Recommendations
- Specific, measurable actions
- Prioritized by impact
- Easy to implement

### Visualizations
- Category spending pie chart
- Income vs expenses bar chart
- Monthly trend line chart
- Budget vs actual comparison

## Common Financial Insights

### Warning Signs
- Spending more than earning (negative cash flow)
- Savings rate below 5%
- Credit card balances increasing
- Emergency fund depleted
- High percentage in discretionary categories

### Positive Indicators
- Consistent month-over-month savings
- Diversified income sources
- Expenses within budget guidelines
- Growing investment contributions
- Low fixed expense ratio
