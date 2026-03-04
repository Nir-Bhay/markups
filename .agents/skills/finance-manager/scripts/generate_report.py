#!/usr/bin/env python3
"""
Generate interactive HTML financial reports with charts and visualizations.
"""

import json
import sys
from datetime import datetime


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Financial Report - {date}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        
        .header {{
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            margin-bottom: 30px;
            text-align: center;
        }}
        
        .header h1 {{
            color: #333;
            font-size: 2.5em;
            margin-bottom: 10px;
        }}
        
        .date-range {{
            color: #666;
            font-size: 1.1em;
        }}
        
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        
        .stat-card {{
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }}
        
        .stat-card h3 {{
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }}
        
        .stat-value {{
            font-size: 2em;
            font-weight: bold;
            color: #333;
        }}
        
        .stat-value.positive {{
            color: #10b981;
        }}
        
        .stat-value.negative {{
            color: #ef4444;
        }}
        
        .chart-container {{
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            margin-bottom: 30px;
        }}
        
        .chart-container h2 {{
            color: #333;
            margin-bottom: 20px;
            font-size: 1.5em;
        }}
        
        .chart-wrapper {{
            position: relative;
            height: 300px;
        }}
        
        .recommendations {{
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }}
        
        .recommendations h2 {{
            color: #333;
            margin-bottom: 20px;
            font-size: 1.5em;
        }}
        
        .recommendation {{
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 10px;
            background: #f3f4f6;
            border-left: 4px solid #667eea;
        }}
        
        .recommendation:last-child {{
            margin-bottom: 0;
        }}
        
        .footer {{
            text-align: center;
            color: white;
            margin-top: 30px;
            padding: 20px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💰 Financial Report</h1>
            <div class="date-range">{date_range}</div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total Income</h3>
                <div class="stat-value positive">${total_income:,.2f}</div>
            </div>
            <div class="stat-card">
                <h3>Total Expenses</h3>
                <div class="stat-value negative">${total_expenses:,.2f}</div>
            </div>
            <div class="stat-card">
                <h3>Net Savings</h3>
                <div class="stat-value {savings_class}">${net_savings:,.2f}</div>
            </div>
            <div class="stat-card">
                <h3>Savings Rate</h3>
                <div class="stat-value {savings_rate_class}">{savings_rate:.1f}%</div>
            </div>
        </div>
        
        <div class="chart-container">
            <h2>📊 Spending by Category</h2>
            <div class="chart-wrapper">
                <canvas id="categoryChart"></canvas>
            </div>
        </div>
        
        <div class="chart-container">
            <h2>📈 Income vs Expenses</h2>
            <div class="chart-wrapper">
                <canvas id="comparisonChart"></canvas>
            </div>
        </div>
        
        <div class="recommendations">
            <h2>💡 Recommendations</h2>
            {recommendations_html}
        </div>
        
        <div class="footer">
            <p>Report Generated: {generation_date}</p>
        </div>
    </div>
    
    <script>
        // Category Pie Chart
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        new Chart(categoryCtx, {{
            type: 'doughnut',
            data: {{
                labels: {category_labels},
                datasets: [{{
                    data: {category_values},
                    backgroundColor: [
                        '#667eea', '#764ba2', '#f093fb', '#4facfe',
                        '#43e97b', '#fa709a', '#fee140', '#30cfd0'
                    ],
                    borderWidth: 0
                }}]
            }},
            options: {{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {{
                    legend: {{
                        position: 'right'
                    }},
                    tooltip: {{
                        callbacks: {{
                            label: function(context) {{
                                return context.label + ': $' + context.parsed.toFixed(2);
                            }}
                        }}
                    }}
                }}
            }}
        }});
        
        // Monthly Comparison Bar Chart
        const comparisonCtx = document.getElementById('comparisonChart').getContext('2d');
        new Chart(comparisonCtx, {{
            type: 'bar',
            data: {{
                labels: {monthly_labels},
                datasets: [
                    {{
                        label: 'Income',
                        data: {monthly_income},
                        backgroundColor: '#10b981',
                        borderRadius: 5
                    }},
                    {{
                        label: 'Expenses',
                        data: {monthly_expenses},
                        backgroundColor: '#ef4444',
                        borderRadius: 5
                    }}
                ]
            }},
            options: {{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {{
                    legend: {{
                        position: 'top'
                    }}
                }},
                scales: {{
                    y: {{
                        beginAtZero: true,
                        ticks: {{
                            callback: function(value) {{
                                return '$' + value.toLocaleString();
                            }}
                        }}
                    }}
                }}
            }}
        }});
    </script>
</body>
</html>
"""


def generate_html_report(analysis_data: dict, output_file: str):
    """Generate HTML report from analysis data."""
    
    summary = analysis_data['summary']
    recommendations = analysis_data['recommendations']
    viz_data = analysis_data['visualization_data']
    
    # Format recommendations
    recommendations_html = '\n'.join([
        f'<div class="recommendation">{rec}</div>' 
        for rec in recommendations
    ])
    
    # Prepare chart data
    category_labels = list(viz_data['category_spending'].keys())
    category_values = list(viz_data['category_spending'].values())
    
    monthly_labels = [item['month'] for item in viz_data['monthly_comparison']]
    monthly_income = [item['income'] for item in viz_data['monthly_comparison']]
    monthly_expenses = [item['expenses'] for item in viz_data['monthly_comparison']]
    
    # Determine savings class
    net_savings = summary['net_savings']
    savings_rate = summary['savings_rate']
    
    savings_class = 'positive' if net_savings > 0 else 'negative'
    savings_rate_class = 'positive' if savings_rate >= 20 else ('negative' if savings_rate < 10 else '')
    
    # Format HTML
    html = HTML_TEMPLATE.format(
        date=datetime.now().strftime('%B %d, %Y'),
        date_range=f"{summary['date_range']['start']} to {summary['date_range']['end']}",
        total_income=summary['total_income'],
        total_expenses=summary['total_expenses'],
        net_savings=net_savings,
        savings_rate=savings_rate,
        savings_class=savings_class,
        savings_rate_class=savings_rate_class,
        recommendations_html=recommendations_html,
        generation_date=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        category_labels=json.dumps(category_labels),
        category_values=json.dumps(category_values),
        monthly_labels=json.dumps(monthly_labels),
        monthly_income=json.dumps(monthly_income),
        monthly_expenses=json.dumps(monthly_expenses)
    )
    
    with open(output_file, 'w') as f:
        f.write(html)
    
    print(f"Report generated: {output_file}")


def main():
    if len(sys.argv) < 3:
        print("Usage: python generate_report.py <analysis_data.json> <output.html>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    with open(input_file, 'r') as f:
        analysis_data = json.load(f)
    
    generate_html_report(analysis_data, output_file)


if __name__ == "__main__":
    main()
