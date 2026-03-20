# CSV Data Visualization Guide

This guide provides best practices for choosing appropriate visualization types based on data characteristics.

## Choosing the Right Visualization

### For Numeric Data Distribution

**Histogram**
- **When to use**: Show the distribution of a single numeric variable
- **Best for**: Understanding data spread, central tendency, and shape
- **Example use cases**: Age distribution, salary ranges, test scores
- **Command**: `--histogram column_name --bins 30`

**Box Plot**
- **When to use**: Compare distributions across categories or identify outliers
- **Best for**: Showing median, quartiles, and outliers
- **Example use cases**: Salary by department, performance by region
- **Command**: `--boxplot column_name --group-by category`

**Violin Plot**
- **When to use**: Similar to box plot but shows full distribution shape
- **Best for**: Detailed distribution comparison with density information
- **Example use cases**: Score distributions across groups
- **Command**: `--violin column_name --group-by category`

### For Relationships Between Variables

**Scatter Plot**
- **When to use**: Show relationship between two numeric variables
- **Best for**: Identifying correlations, trends, and clusters
- **Example use cases**: Height vs weight, price vs demand, age vs income
- **Command**: `--scatter x_column y_column --color category`
- **With trend line**: Automatically added when no color grouping

**Correlation Heatmap**
- **When to use**: Show correlations between multiple numeric variables
- **Best for**: Identifying which variables are related
- **Example use cases**: Feature correlation analysis, multicollinearity detection
- **Command**: `--correlation`

### For Time Series Data

**Line Chart**
- **When to use**: Show trends over time or ordered sequences
- **Best for**: Temporal patterns, trends, seasonality
- **Example use cases**: Sales over time, stock prices, temperature trends
- **Command**: `--line date_column value_column`
- **Multiple series**: `--line date_column "value1,value2,value3"`

### For Categorical Data

**Bar Chart**
- **When to use**: Compare values across categories
- **Best for**: Discrete categories with counts or aggregated values
- **Example use cases**: Sales by region, counts by category
- **Command**: `--bar category_column`

**Pie Chart**
- **When to use**: Show composition of a whole (use sparingly)
- **Best for**: Simple proportions with few categories (3-5 max)
- **Example use cases**: Market share, budget allocation
- **Command**: `--pie category_column`
- **Note**: Use bar charts instead for better comparisons

## Data Profiling Recommendations

Before creating visualizations, run data profiling to understand:
- Data types and ranges
- Missing data patterns
- Outliers and data quality issues
- Statistical distributions

**Usage**: `python3 scripts/data_profile.py data.csv`

This helps identify:
- Which columns are suitable for visualization
- Data quality issues that need addressing
- Appropriate visualization types for each column

## Dashboard Best Practices

**Automatic Dashboard**
- Analyzes data types and creates appropriate visualizations
- Good starting point for exploratory analysis
- Usage: `python3 scripts/create_dashboard.py data.csv`

**Custom Dashboard**
- Create JSON config file specifying exact plots desired
- Better for specific analysis goals or presentations
- Allows precise control over layout and content

### Dashboard Configuration Example

```json
{
  "title": "Sales Analysis Dashboard",
  "plots": [
    {"type": "histogram", "column": "revenue"},
    {"type": "box", "column": "revenue", "group_by": "region"},
    {"type": "scatter", "column": "advertising_spend", "group_by": "revenue"},
    {"type": "bar", "column": "product_category"},
    {"type": "correlation"}
  ]
}
```

## Common Visualization Patterns

### Exploratory Data Analysis
1. Run data profiling first
2. Create histograms for all numeric columns
3. Generate correlation heatmap
4. Create box plots grouped by key categories
5. Use automatic dashboard for quick overview

### Presentation/Reporting
1. Identify key insights to communicate
2. Choose specific visualizations that support the narrative
3. Use custom dashboard with carefully selected plots
4. Export to multiple formats (HTML for interactive, PNG for reports)

### Quality Checks
- Check for outliers using box plots
- Verify distributions with histograms
- Identify missing patterns with data profiling
- Look for unexpected correlations in heatmaps

## Output Formats

All visualization scripts support multiple output formats:
- **HTML** (default): Interactive Plotly visualizations with zoom, pan, hover
- **PNG**: Static images for reports and presentations
- **PDF**: Vector graphics for publications
- **SVG**: Scalable vector graphics

Specify format with file extension: `-o output.html`, `-o output.png`, etc.

## Performance Considerations

- **Large datasets** (>100K rows): Consider sampling for interactive plots
- **Many categories**: Limit to top N categories for bar/pie charts
- **High cardinality**: Group rare categories into "Other"
- **Dashboard plots**: Keep to 6-9 plots maximum for readability
