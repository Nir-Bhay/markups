#!/usr/bin/env python3
"""
Comprehensive financial analysis tool for processing transaction data,
generating insights, and creating visualizations.
"""

import pandas as pd
import json
from datetime import datetime
from typing import Dict, List, Tuple
import sys


def load_transactions(file_path: str) -> pd.DataFrame:
    """Load transaction data from CSV or JSON file."""
    if file_path.endswith('.csv'):
        df = pd.read_csv(file_path)
    elif file_path.endswith('.json'):
        df = pd.read_json(file_path)
    else:
        raise ValueError("Unsupported file format. Use CSV or JSON.")
    
    # Convert date column to datetime
    df['Date'] = pd.to_datetime(df['Date'])
    return df


def calculate_summary_stats(df: pd.DataFrame) -> Dict:
    """Calculate summary statistics from transaction data."""
    total_income = df[df['Type'] == 'Income']['Amount'].sum()
    total_expenses = abs(df[df['Type'] == 'Expense']['Amount'].sum())
    net_savings = total_income - total_expenses
    
    # Category breakdown for expenses
    expense_by_category = df[df['Type'] == 'Expense'].groupby('Income')['Amount'].sum().abs().to_dict()
    
    # Income breakdown
    income_by_source = df[df['Type'] == 'Income'].groupby('Description')['Amount'].sum().to_dict()
    
    return {
        'total_income': float(total_income),
        'total_expenses': float(total_expenses),
        'net_savings': float(net_savings),
        'savings_rate': float((net_savings / total_income * 100) if total_income > 0 else 0),
        'expense_by_category': expense_by_category,
        'income_by_source': income_by_source,
        'transaction_count': len(df),
        'date_range': {
            'start': df['Date'].min().strftime('%Y-%m-%d'),
            'end': df['Date'].max().strftime('%Y-%m-%d')
        }
    }


def analyze_spending_trends(df: pd.DataFrame) -> Dict:
    """Analyze spending patterns and trends."""
    expenses = df[df['Type'] == 'Expense'].copy()
    
    # Daily spending average
    date_range = (expenses['Date'].max() - expenses['Date'].min()).days + 1
    daily_avg = abs(expenses['Amount'].sum()) / date_range if date_range > 0 else 0
    
    # Top expenses
    top_expenses = expenses.nlargest(5, 'Amount', keep='all')[['Date', 'Description', 'Amount']].to_dict('records')
    for expense in top_expenses:
        expense['Date'] = expense['Date'].strftime('%Y-%m-%d')
        expense['Amount'] = abs(float(expense['Amount']))
    
    # Category percentages
    category_totals = expenses.groupby('Income')['Amount'].sum().abs()
    category_percentages = (category_totals / category_totals.sum() * 100).to_dict()
    
    return {
        'daily_average_spending': float(daily_avg),
        'top_expenses': top_expenses,
        'category_percentages': {k: float(v) for k, v in category_percentages.items()}
    }


def generate_budget_recommendations(summary: Dict, trends: Dict) -> List[str]:
    """Generate personalized budget recommendations based on spending patterns."""
    recommendations = []
    
    # Savings rate recommendations
    savings_rate = summary['savings_rate']
    if savings_rate < 10:
        recommendations.append("⚠️ Your savings rate is below 10%. Consider reducing discretionary spending.")
    elif savings_rate < 20:
        recommendations.append("💡 Good start! Try to increase your savings rate to 20% for better financial security.")
    else:
        recommendations.append("✅ Excellent savings rate! You're on track for strong financial health.")
    
    # Category-specific recommendations
    expense_categories = summary['expense_by_category']
    total_expenses = summary['total_expenses']
    
    for category, amount in expense_categories.items():
        percentage = (amount / total_expenses * 100) if total_expenses > 0 else 0
        
        if category == 'Food' and percentage > 15:
            recommendations.append(f"🍽️ Food spending is {percentage:.1f}% of expenses. Consider meal planning to reduce costs.")
        elif category == 'Shopping' and percentage > 10:
            recommendations.append(f"🛍️ Shopping represents {percentage:.1f}% of expenses. Review for unnecessary purchases.")
        elif category == 'Transportation' and percentage > 15:
            recommendations.append(f"🚗 Transportation costs are {percentage:.1f}% of expenses. Explore carpooling or public transit options.")
    
    # Income diversification
    income_sources = len(summary['income_by_source'])
    if income_sources == 1:
        recommendations.append("💼 Consider diversifying income sources for financial stability.")
    elif income_sources > 2:
        recommendations.append("✅ Great job diversifying your income streams!")
    
    return recommendations


def create_visualization_data(df: pd.DataFrame) -> Dict:
    """Prepare data structure for visualization."""
    expenses = df[df['Type'] == 'Expense'].copy()
    income = df[df['Type'] == 'Income'].copy()
    
    # Category spending data
    category_data = expenses.groupby('Income')['Amount'].sum().abs().to_dict()
    
    # Daily spending trend
    expenses['Date_Only'] = expenses['Date'].dt.date
    daily_spending = expenses.groupby('Date_Only')['Amount'].sum().abs()
    daily_trend = [{'date': str(date), 'amount': float(amount)} for date, amount in daily_spending.items()]
    
    # Income vs Expenses over time
    expenses['YearMonth'] = expenses['Date'].dt.to_period('M').astype(str)
    income['YearMonth'] = income['Date'].dt.to_period('M').astype(str)
    
    monthly_expenses = expenses.groupby('YearMonth')['Amount'].sum().abs()
    monthly_income = income.groupby('YearMonth')['Amount'].sum()
    
    monthly_comparison = []
    all_months = sorted(set(monthly_expenses.index) | set(monthly_income.index))
    for month in all_months:
        monthly_comparison.append({
            'month': month,
            'income': float(monthly_income.get(month, 0)),
            'expenses': float(monthly_expenses.get(month, 0))
        })
    
    return {
        'category_spending': category_data,
        'daily_trend': daily_trend,
        'monthly_comparison': monthly_comparison
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze_finances.py <transaction_file.csv>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    # Load data
    df = load_transactions(file_path)
    
    # Generate analysis
    summary = calculate_summary_stats(df)
    trends = analyze_spending_trends(df)
    recommendations = generate_budget_recommendations(summary, trends)
    viz_data = create_visualization_data(df)
    
    # Compile full report
    report = {
        'summary': summary,
        'trends': trends,
        'recommendations': recommendations,
        'visualization_data': viz_data
    }
    
    # Output as JSON
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
