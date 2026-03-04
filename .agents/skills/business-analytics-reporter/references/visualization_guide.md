# Data Visualization Guide for Business Reports

## Recommended Chart Types for Business Analysis

### Revenue & Sales Analysis

#### Line Charts
**Use for**: Trends over time, growth analysis
**Best for**: Revenue trends, sales performance, growth rates
**Example**: Monthly revenue over the past year

#### Bar Charts
**Use for**: Category comparisons, rankings
**Best for**: Revenue by product, sales by region, performance rankings
**Example**: Top 10 products by revenue

#### Stacked Bar Charts
**Use for**: Part-to-whole comparisons over categories
**Best for**: Revenue composition, segment contribution
**Example**: Revenue breakdown by product category per quarter

### Performance Analysis

#### Area Charts
**Use for**: Cumulative trends, volume over time
**Best for**: Cumulative revenue, market share evolution
**Example**: Year-to-date revenue accumulation

#### Waterfall Charts
**Use for**: Sequential changes, breakdowns
**Best for**: Revenue bridges, variance analysis
**Example**: How revenue changed from Q1 to Q2

#### Scatter Plots
**Use for**: Correlation analysis, outlier detection
**Best for**: Price vs. volume, cost vs. revenue relationships
**Example**: Product performance matrix (volume vs. margin)

### Composition & Distribution

#### Pie/Donut Charts
**Use for**: Part-to-whole relationships (limit to 5-7 segments)
**Best for**: Market share, revenue composition
**Example**: Percentage contribution by product line

#### Treemap
**Use for**: Hierarchical part-to-whole with many categories
**Best for**: Revenue contribution with subcategories
**Example**: Revenue by region, then by product

#### Box Plots
**Use for**: Distribution analysis, variability
**Best for**: Revenue distribution, outlier identification
**Example**: Monthly sales distribution over a year

### Comparison Analysis

#### Grouped Bar Charts
**Use for**: Multiple metrics across categories
**Best for**: Year-over-year comparisons, before/after analysis
**Example**: 2024 vs 2025 revenue by quarter

#### Heatmaps
**Use for**: Pattern identification, correlation matrices
**Best for**: Performance by time period and category
**Example**: Sales performance by day of week and hour

#### Bullet Charts
**Use for**: Target vs. actual performance
**Best for**: KPI dashboards, goal tracking
**Example**: Revenue vs. target with performance bands

## Python Visualization Libraries

### Plotly (Recommended for Interactive Reports)
```python
import plotly.graph_objects as go
import plotly.express as px

# Interactive line chart
fig = px.line(df, x='date', y='revenue', title='Revenue Trend')
fig.show()

# Interactive bar chart
fig = px.bar(df, x='category', y='sales', color='region')
fig.show()
```

### Matplotlib + Seaborn (For Static Reports)
```python
import matplotlib.pyplot as plt
import seaborn as sns

# Simple line plot
plt.figure(figsize=(10, 6))
plt.plot(df['date'], df['revenue'])
plt.title('Revenue Over Time')
plt.xlabel('Date')
plt.ylabel('Revenue ($)')
plt.show()

# Seaborn bar plot
sns.barplot(data=df, x='category', y='sales')
plt.show()
```

## Visualization Best Practices

### Color Usage
- **Consistent color scheme**: Use same colors for same categories across charts
- **Highlight important data**: Use accent colors for key insights
- **Accessibility**: Ensure color-blind friendly palettes
- **Professional palette**: Stick to 3-5 primary colors

Recommended color schemes:
- **Growth/Positive**: Green shades
- **Decline/Negative**: Red shades
- **Neutral/Baseline**: Gray or blue shades
- **Categories**: Distinct, contrasting colors

### Chart Design Principles
1. **Clarity**: Remove chartjunk, keep it simple
2. **Context**: Always label axes, add titles and legends
3. **Scale**: Start y-axis at zero for bar charts (unless showing variance)
4. **Sorting**: Order categories by value (descending) for better readability
5. **Annotations**: Highlight key data points with labels or callouts

### Dashboard Layout
For comprehensive business reports, organize visualizations:

1. **Executive Summary Section**
   - Key metric cards (total revenue, growth rate, etc.)
   - Primary trend chart (overall performance)

2. **Deep Dive Analysis**
   - Category breakdown charts
   - Time-based analysis
   - Comparison charts

3. **Insights & Weak Areas**
   - Highlight charts showing problem areas
   - Performance distribution
   - Outlier identification

4. **Recommendations**
   - Goal vs. actual charts
   - Projected impact visualizations

## Chart Creation Examples

### Example 1: Revenue Trend with Growth Rate
```python
import plotly.graph_objects as go
from plotly.subplots import make_subplots

# Create figure with secondary y-axis
fig = make_subplots(specs=[[{"secondary_y": True}]])

# Add revenue line
fig.add_trace(
    go.Scatter(x=df['date'], y=df['revenue'], name="Revenue", line=dict(color='blue', width=3)),
    secondary_y=False
)

# Add growth rate line
fig.add_trace(
    go.Scatter(x=df['date'], y=df['growth_rate'], name="Growth Rate", line=dict(color='green', dash='dash')),
    secondary_y=True
)

# Update axes
fig.update_xaxes(title_text="Date")
fig.update_yaxes(title_text="Revenue ($)", secondary_y=False)
fig.update_yaxes(title_text="Growth Rate (%)", secondary_y=True)

fig.update_layout(title_text="Revenue Performance & Growth Rate")
```

### Example 2: Category Performance Comparison
```python
import plotly.express as px

# Sort by revenue descending
df_sorted = df.sort_values('revenue', ascending=False)

# Create bar chart
fig = px.bar(
    df_sorted,
    x='category',
    y='revenue',
    color='performance_tier',  # e.g., 'High', 'Medium', 'Low'
    title='Revenue by Category',
    labels={'revenue': 'Revenue ($)', 'category': 'Product Category'},
    color_discrete_map={'High': 'green', 'Medium': 'orange', 'Low': 'red'}
)

fig.update_layout(xaxis_tickangle=-45)
```

### Example 3: Variance Analysis (Waterfall)
```python
import plotly.graph_objects as go

# Example: Q1 to Q2 revenue bridge
fig = go.Figure(go.Waterfall(
    x=['Q1 Revenue', 'New Sales', 'Churn', 'Price Increase', 'Q2 Revenue'],
    y=[1000, 300, -150, 100, 1250],
    measure=['absolute', 'relative', 'relative', 'relative', 'total'],
    text=['+1000', '+300', '-150', '+100', '1250'],
    textposition='outside',
    connector={'line': {'color': 'rgb(63, 63, 63)'}},
))

fig.update_layout(title='Q1 to Q2 Revenue Bridge', yaxis_title='Revenue ($1000s)')
```

## HTML Report Template Structure

```html
<!DOCTYPE html>
<html>
<head>
    <title>Business Analysis Report</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 40px; }
        .metric-card { display: inline-block; background: #ecf0f1; padding: 20px; margin: 10px; border-radius: 5px; }
        .weak-area { background: #ffe6e6; padding: 15px; margin: 10px 0; border-left: 4px solid #e74c3c; }
        .strategy { background: #e6f7ff; padding: 15px; margin: 10px 0; border-left: 4px solid #3498db; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Business Performance Analysis Report</h1>
        <p>Generated: [Date]</p>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <!-- Metric cards -->
    </div>

    <div class="section">
        <h2>Performance Trends</h2>
        <div id="trend-chart"></div>
    </div>

    <div class="section">
        <h2>Areas of Weakness</h2>
        <!-- Weak area cards with charts -->
    </div>

    <div class="section">
        <h2>Improvement Strategies</h2>
        <!-- Strategy recommendations -->
    </div>

    <script>
        // Plotly chart JavaScript
    </script>
</body>
</html>
```

## Integration with Analysis Script

When using the `analyze_business_data.py` script, create visualizations for:

1. **Revenue Trend Chart**: Line chart showing revenue over time with growth rate overlay
2. **Category Performance Chart**: Bar chart of revenue by category, sorted by performance
3. **Volatility Chart**: Box plot or standard deviation chart showing revenue stability
4. **Weak Areas Heatmap**: Visual representation of severity and impact
5. **Strategy Impact Projection**: Chart showing expected improvement trajectories
