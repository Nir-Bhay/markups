#!/usr/bin/env python3
"""
Business Data Analysis and Report Generator

This script analyzes business sales and revenue data from CSV files and generates
comprehensive reports with insights on areas of weakness and improvement strategies.
"""

import pandas as pd
import numpy as np
import json
import sys
from datetime import datetime
from pathlib import Path


def load_and_validate_data(csv_path):
    """Load CSV data and perform basic validation."""
    try:
        df = pd.read_csv(csv_path)
        print(f"✓ Loaded data: {len(df)} rows, {len(df.columns)} columns")
        return df
    except Exception as e:
        print(f"✗ Error loading CSV: {e}", file=sys.stderr)
        sys.exit(1)


def detect_data_structure(df):
    """Detect what type of business data we're working with."""
    columns_lower = [col.lower() for col in df.columns]

    data_type = {
        'has_revenue': any(key in ' '.join(columns_lower) for key in ['revenue', 'sales', 'amount', 'price', 'total']),
        'has_date': any(key in ' '.join(columns_lower) for key in ['date', 'time', 'month', 'year', 'period']),
        'has_category': any(key in ' '.join(columns_lower) for key in ['category', 'product', 'region', 'department', 'type']),
        'has_quantity': any(key in ' '.join(columns_lower) for key in ['quantity', 'units', 'count', 'volume']),
        'has_customer': any(key in ' '.join(columns_lower) for key in ['customer', 'client', 'user'])
    }

    return data_type


def calculate_basic_stats(df, revenue_col=None):
    """Calculate basic statistical metrics."""
    stats = {
        'total_rows': len(df),
        'date_range': None,
        'basic_stats': {}
    }

    # Detect date column
    date_cols = [col for col in df.columns if any(x in col.lower() for x in ['date', 'time'])]
    if date_cols:
        try:
            df[date_cols[0]] = pd.to_datetime(df[date_cols[0]], errors='coerce')
            stats['date_range'] = {
                'start': df[date_cols[0]].min().strftime('%Y-%m-%d') if pd.notna(df[date_cols[0]].min()) else None,
                'end': df[date_cols[0]].max().strftime('%Y-%m-%d') if pd.notna(df[date_cols[0]].max()) else None
            }
        except:
            pass

    # Calculate stats for numeric columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        stats['basic_stats'][col] = {
            'mean': float(df[col].mean()),
            'median': float(df[col].median()),
            'std': float(df[col].std()),
            'min': float(df[col].min()),
            'max': float(df[col].max()),
            'total': float(df[col].sum())
        }

    return stats


def identify_revenue_column(df):
    """Automatically identify the revenue/sales column."""
    revenue_keywords = ['revenue', 'sales', 'amount', 'total', 'price', 'value']

    for col in df.columns:
        if any(keyword in col.lower() for keyword in revenue_keywords):
            if df[col].dtype in [np.float64, np.int64]:
                return col

    # Fallback: return first numeric column
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    return numeric_cols[0] if len(numeric_cols) > 0 else None


def analyze_trends(df, date_col=None, value_col=None):
    """Analyze trends over time."""
    if date_col is None or value_col is None:
        return None

    try:
        df_sorted = df.sort_values(date_col)

        # Calculate period-over-period growth
        df_sorted['prev_value'] = df_sorted[value_col].shift(1)
        df_sorted['growth_rate'] = ((df_sorted[value_col] - df_sorted['prev_value']) / df_sorted['prev_value'] * 100)

        avg_growth = df_sorted['growth_rate'].mean()

        # Identify declining periods
        declining_periods = df_sorted[df_sorted['growth_rate'] < 0]

        return {
            'average_growth_rate': float(avg_growth) if pd.notna(avg_growth) else 0,
            'declining_period_count': len(declining_periods),
            'declining_percentage': (len(declining_periods) / len(df_sorted) * 100) if len(df_sorted) > 0 else 0
        }
    except:
        return None


def analyze_categories(df, category_col=None, value_col=None):
    """Analyze performance by category."""
    if category_col is None or value_col is None:
        return None

    try:
        category_stats = df.groupby(category_col)[value_col].agg([
            ('total', 'sum'),
            ('average', 'mean'),
            ('count', 'count')
        ]).round(2)

        # Calculate percentage contribution
        category_stats['percentage'] = (category_stats['total'] / category_stats['total'].sum() * 100).round(2)

        # Identify underperforming categories (bottom 25%)
        threshold = category_stats['average'].quantile(0.25)
        underperforming = category_stats[category_stats['average'] <= threshold]

        return {
            'categories': category_stats.to_dict('index'),
            'underperforming_categories': list(underperforming.index),
            'top_category': category_stats['total'].idxmax(),
            'bottom_category': category_stats['total'].idxmin()
        }
    except:
        return None


def calculate_variability(df, value_col):
    """Calculate coefficient of variation to assess stability."""
    try:
        mean_val = df[value_col].mean()
        std_val = df[value_col].std()
        cv = (std_val / mean_val * 100) if mean_val != 0 else 0

        return {
            'coefficient_of_variation': float(cv),
            'stability_assessment': 'High volatility' if cv > 50 else 'Moderate volatility' if cv > 25 else 'Stable'
        }
    except:
        return None


def generate_analysis_report(df):
    """Generate comprehensive analysis report."""
    report = {
        'metadata': {
            'analysis_date': datetime.now().isoformat(),
            'data_shape': {'rows': len(df), 'columns': len(df.columns)},
            'columns': list(df.columns)
        },
        'data_structure': detect_data_structure(df),
        'findings': {}
    }

    # Identify key columns
    revenue_col = identify_revenue_column(df)
    date_cols = [col for col in df.columns if any(x in col.lower() for x in ['date', 'time'])]
    date_col = date_cols[0] if date_cols else None
    category_cols = [col for col in df.columns if any(x in col.lower() for x in ['category', 'product', 'region', 'type', 'department'])]
    category_col = category_cols[0] if category_cols else None

    report['key_columns'] = {
        'revenue_column': revenue_col,
        'date_column': date_col,
        'category_column': category_col
    }

    # Basic statistics
    report['findings']['basic_statistics'] = calculate_basic_stats(df, revenue_col)

    # Trend analysis
    if date_col and revenue_col:
        try:
            df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
            report['findings']['trend_analysis'] = analyze_trends(df, date_col, revenue_col)
        except:
            report['findings']['trend_analysis'] = None

    # Category analysis
    if category_col and revenue_col:
        report['findings']['category_analysis'] = analyze_categories(df, category_col, revenue_col)

    # Variability analysis
    if revenue_col:
        report['findings']['variability'] = calculate_variability(df, revenue_col)

    return report


def identify_weak_areas(report):
    """Identify areas where the business is lacking."""
    weak_areas = []

    # Check trend analysis
    if report['findings'].get('trend_analysis'):
        trend = report['findings']['trend_analysis']
        if trend['average_growth_rate'] < 0:
            weak_areas.append({
                'area': 'Revenue Growth',
                'severity': 'High',
                'finding': f"Negative average growth rate of {trend['average_growth_rate']:.2f}%",
                'metric': trend['average_growth_rate']
            })

        if trend['declining_percentage'] > 40:
            weak_areas.append({
                'area': 'Performance Consistency',
                'severity': 'Medium',
                'finding': f"{trend['declining_percentage']:.1f}% of periods show declining performance",
                'metric': trend['declining_percentage']
            })

    # Check variability
    if report['findings'].get('variability'):
        variability = report['findings']['variability']
        if variability['coefficient_of_variation'] > 50:
            weak_areas.append({
                'area': 'Revenue Stability',
                'severity': 'Medium',
                'finding': f"High volatility detected (CV: {variability['coefficient_of_variation']:.1f}%)",
                'metric': variability['coefficient_of_variation']
            })

    # Check category performance
    if report['findings'].get('category_analysis'):
        cat_analysis = report['findings']['category_analysis']
        if cat_analysis['underperforming_categories']:
            weak_areas.append({
                'area': 'Category Performance',
                'severity': 'Medium',
                'finding': f"{len(cat_analysis['underperforming_categories'])} underperforming categories identified",
                'details': cat_analysis['underperforming_categories']
            })

    return weak_areas


def generate_improvement_strategies(weak_areas, report):
    """Generate specific improvement strategies based on weak areas."""
    strategies = []

    for weak_area in weak_areas:
        if weak_area['area'] == 'Revenue Growth':
            strategies.append({
                'area': 'Revenue Growth',
                'strategy': 'Revenue Acceleration Program',
                'actions': [
                    'Implement aggressive customer acquisition campaigns',
                    'Review and optimize pricing strategy',
                    'Launch upselling and cross-selling initiatives',
                    'Expand into new market segments or geographies',
                    'Accelerate product development and innovation'
                ],
                'expected_impact': 'High',
                'timeline': '3-6 months'
            })

        elif weak_area['area'] == 'Performance Consistency':
            strategies.append({
                'area': 'Performance Consistency',
                'strategy': 'Business Stabilization Plan',
                'actions': [
                    'Establish consistent sales processes and methodologies',
                    'Implement predictive analytics for demand forecasting',
                    'Develop recurring revenue streams (subscriptions, contracts)',
                    'Build customer loyalty programs to increase retention',
                    'Smooth out seasonal variations with counter-cyclical products'
                ],
                'expected_impact': 'Medium',
                'timeline': '4-8 months'
            })

        elif weak_area['area'] == 'Revenue Stability':
            strategies.append({
                'area': 'Revenue Stability',
                'strategy': 'Volatility Reduction Initiative',
                'actions': [
                    'Diversify revenue streams across products and customer segments',
                    'Establish minimum order requirements or retainer agreements',
                    'Implement inventory management to reduce supply chain disruptions',
                    'Create predictable pricing models (annual contracts vs. spot pricing)',
                    'Build strategic partnerships for consistent deal flow'
                ],
                'expected_impact': 'Medium',
                'timeline': '6-12 months'
            })

        elif weak_area['area'] == 'Category Performance':
            strategies.append({
                'area': 'Category Performance',
                'strategy': 'Portfolio Optimization',
                'actions': [
                    'Conduct deep-dive analysis on underperforming categories',
                    'Consider discontinuing or restructuring bottom performers',
                    'Reallocate resources to high-performing categories',
                    'Investigate pricing, positioning, or quality issues',
                    'Test targeted marketing campaigns for weak categories'
                ],
                'expected_impact': 'High',
                'timeline': '2-4 months'
            })

    # Add general recommendations
    strategies.append({
        'area': 'Data-Driven Culture',
        'strategy': 'Analytics Infrastructure Development',
        'actions': [
            'Implement real-time dashboards for key business metrics',
            'Establish regular reporting cadence (daily, weekly, monthly)',
            'Train team on data interpretation and decision-making',
            'Set up automated alerts for anomaly detection',
            'Build customer segmentation and cohort analysis capabilities'
        ],
        'expected_impact': 'High',
        'timeline': '3-6 months'
    })

    return strategies


def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze_business_data.py <path_to_csv> [output_json]")
        sys.exit(1)

    csv_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "business_analysis_report.json"

    print(f"\n📊 Business Data Analysis Report Generator")
    print(f"{'=' * 60}\n")

    # Load data
    print(f"Loading data from: {csv_path}")
    df = load_and_validate_data(csv_path)

    # Generate analysis
    print("\nAnalyzing business data...")
    report = generate_analysis_report(df)

    # Identify weak areas
    print("Identifying areas of weakness...")
    weak_areas = identify_weak_areas(report)
    report['weak_areas'] = weak_areas

    # Generate strategies
    print("Generating improvement strategies...")
    strategies = generate_improvement_strategies(weak_areas, report)
    report['improvement_strategies'] = strategies

    # Save report
    with open(output_path, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\n✓ Analysis complete! Report saved to: {output_path}")
    print(f"\nKey Findings:")
    print(f"  - {len(weak_areas)} areas of weakness identified")
    print(f"  - {len(strategies)} improvement strategies generated")

    if weak_areas:
        print(f"\nWeak Areas Summary:")
        for area in weak_areas:
            print(f"  • {area['area']} ({area['severity']} severity): {area['finding']}")


if __name__ == "__main__":
    main()
