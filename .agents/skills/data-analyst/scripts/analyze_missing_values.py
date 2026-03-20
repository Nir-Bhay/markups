#!/usr/bin/env python3
"""
Analyze missing values in a dataset and suggest appropriate imputation strategies.
"""

import pandas as pd
import numpy as np
import json
import sys
from pathlib import Path


def detect_column_type(series):
    """Detect the semantic type of a column for better imputation."""
    # Remove missing values for analysis
    clean_series = series.dropna()

    if len(clean_series) == 0:
        return 'unknown'

    # Check if numeric
    if pd.api.types.is_numeric_dtype(series):
        # Check if it's likely categorical (few unique values)
        unique_ratio = len(clean_series.unique()) / len(clean_series)
        if unique_ratio < 0.05 and len(clean_series.unique()) < 20:
            return 'categorical_numeric'

        # Check if it's an ID column (monotonic or very high cardinality)
        if clean_series.is_monotonic_increasing or unique_ratio > 0.95:
            return 'id'

        # Check distribution characteristics
        skewness = clean_series.skew()
        if abs(skewness) < 0.5:
            return 'numeric_normal'
        else:
            return 'numeric_skewed'

    # Check if datetime
    elif pd.api.types.is_datetime64_any_dtype(series):
        return 'datetime'

    # Check if categorical/object
    elif pd.api.types.is_object_dtype(series) or pd.api.types.is_categorical_dtype(series):
        unique_ratio = len(clean_series.unique()) / len(clean_series)

        if unique_ratio > 0.9:
            return 'text_unique'
        elif unique_ratio < 0.1:
            return 'categorical_low_cardinality'
        else:
            return 'categorical_medium_cardinality'

    return 'unknown'


def suggest_imputation_strategy(series, col_type):
    """Suggest the best imputation strategy based on column type and data characteristics."""
    missing_pct = (series.isna().sum() / len(series)) * 100

    strategies = {
        'method': None,
        'reasoning': '',
        'alternative': None
    }

    # High missing rate - consider dropping or special handling
    if missing_pct > 50:
        strategies['method'] = 'drop_or_flag'
        strategies['reasoning'] = f'{missing_pct:.1f}% missing - consider dropping column or creating missing indicator'
        return strategies

    # Strategy based on column type
    if col_type == 'numeric_normal':
        strategies['method'] = 'mean'
        strategies['reasoning'] = 'Normally distributed numeric data - mean imputation appropriate'
        strategies['alternative'] = 'median'

    elif col_type == 'numeric_skewed':
        strategies['method'] = 'median'
        strategies['reasoning'] = 'Skewed numeric data - median more robust than mean'
        strategies['alternative'] = 'knn'

    elif col_type == 'categorical_numeric':
        strategies['method'] = 'mode'
        strategies['reasoning'] = 'Numeric data with categorical nature - mode imputation'
        strategies['alternative'] = 'most_frequent'

    elif col_type in ['categorical_low_cardinality', 'categorical_medium_cardinality']:
        strategies['method'] = 'mode'
        strategies['reasoning'] = 'Categorical data - mode (most frequent) imputation'
        strategies['alternative'] = 'constant:Unknown'

    elif col_type == 'text_unique':
        strategies['method'] = 'constant'
        strategies['reasoning'] = 'High cardinality text - impute with constant value'
        strategies['alternative'] = 'drop_rows'

    elif col_type == 'datetime':
        strategies['method'] = 'forward_fill'
        strategies['reasoning'] = 'DateTime data - forward fill (carry last observation forward)'
        strategies['alternative'] = 'interpolate'

    elif col_type == 'id':
        strategies['method'] = 'drop_rows'
        strategies['reasoning'] = 'ID column - cannot impute, drop rows with missing IDs'
        strategies['alternative'] = 'generate_sequence'

    else:
        strategies['method'] = 'knn'
        strategies['reasoning'] = 'Unknown type - use KNN imputation based on similar rows'
        strategies['alternative'] = 'drop_rows'

    return strategies


def analyze_missing_values(filepath, output_json=None):
    """
    Analyze missing values in a CSV file and generate a comprehensive report.

    Args:
        filepath: Path to the CSV file
        output_json: Optional path to save analysis results as JSON

    Returns:
        Dictionary containing analysis results
    """
    # Load data
    df = pd.read_csv(filepath)

    # Calculate overall statistics
    total_rows = len(df)
    total_cells = df.size
    missing_cells = df.isna().sum().sum()
    missing_pct = (missing_cells / total_cells) * 100

    # Analyze each column
    column_analysis = {}

    for col in df.columns:
        missing_count = df[col].isna().sum()
        missing_pct_col = (missing_count / total_rows) * 100

        if missing_count > 0:
            col_type = detect_column_type(df[col])
            strategy = suggest_imputation_strategy(df[col], col_type)

            # Calculate statistics for non-missing values
            clean_data = df[col].dropna()
            stats = {}

            if pd.api.types.is_numeric_dtype(df[col]):
                stats = {
                    'mean': float(clean_data.mean()),
                    'median': float(clean_data.median()),
                    'std': float(clean_data.std()),
                    'min': float(clean_data.min()),
                    'max': float(clean_data.max())
                }
            elif pd.api.types.is_object_dtype(df[col]) or pd.api.types.is_categorical_dtype(df[col]):
                value_counts = clean_data.value_counts().head(5)
                stats = {
                    'unique_values': int(clean_data.nunique()),
                    'most_common': value_counts.to_dict()
                }

            column_analysis[col] = {
                'missing_count': int(missing_count),
                'missing_percentage': float(missing_pct_col),
                'data_type': str(df[col].dtype),
                'detected_type': col_type,
                'total_values': int(total_rows),
                'non_missing_values': int(total_rows - missing_count),
                'statistics': stats,
                'imputation_strategy': strategy
            }

    # Build complete report
    report = {
        'file': str(filepath),
        'total_rows': int(total_rows),
        'total_columns': int(len(df.columns)),
        'total_cells': int(total_cells),
        'missing_cells': int(missing_cells),
        'missing_percentage': float(missing_pct),
        'columns_with_missing': len(column_analysis),
        'column_analysis': column_analysis
    }

    # Save to JSON if requested
    if output_json:
        with open(output_json, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"Analysis saved to: {output_json}")

    return report


def print_report(report):
    """Print a formatted report to console."""
    print("\n" + "="*80)
    print("MISSING VALUES ANALYSIS REPORT")
    print("="*80)
    print(f"\nFile: {report['file']}")
    print(f"Dimensions: {report['total_rows']} rows × {report['total_columns']} columns")
    print(f"\nOverall Missing Data:")
    print(f"  - Missing cells: {report['missing_cells']:,} / {report['total_cells']:,}")
    print(f"  - Missing percentage: {report['missing_percentage']:.2f}%")
    print(f"  - Columns with missing values: {report['columns_with_missing']}")

    if report['columns_with_missing'] > 0:
        print("\n" + "-"*80)
        print("COLUMN-BY-COLUMN ANALYSIS")
        print("-"*80)

        for col, analysis in report['column_analysis'].items():
            print(f"\n📊 Column: {col}")
            print(f"   Type: {analysis['data_type']} (detected as: {analysis['detected_type']})")
            print(f"   Missing: {analysis['missing_count']:,} / {analysis['total_values']:,} ({analysis['missing_percentage']:.2f}%)")

            # Print statistics
            if analysis['statistics']:
                print(f"   Statistics:")
                for key, value in analysis['statistics'].items():
                    if isinstance(value, float):
                        print(f"     - {key}: {value:.4f}")
                    elif isinstance(value, dict) and key == 'most_common':
                        print(f"     - {key}:")
                        for val, count in value.items():
                            print(f"       • {val}: {count}")
                    else:
                        print(f"     - {key}: {value}")

            # Print imputation strategy
            strategy = analysis['imputation_strategy']
            print(f"   ✅ Recommended: {strategy['method']}")
            print(f"      Reason: {strategy['reasoning']}")
            if strategy['alternative']:
                print(f"      Alternative: {strategy['alternative']}")
    else:
        print("\n✅ No missing values found in the dataset!")

    print("\n" + "="*80 + "\n")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python analyze_missing_values.py <csv_file> [output_json]")
        sys.exit(1)

    filepath = sys.argv[1]
    output_json = sys.argv[2] if len(sys.argv) > 2 else None

    if not Path(filepath).exists():
        print(f"Error: File not found: {filepath}")
        sys.exit(1)

    report = analyze_missing_values(filepath, output_json)
    print_report(report)
