#!/usr/bin/env python3
"""
Automatically impute missing values in a dataset based on analysis.
"""

import pandas as pd
import numpy as np
import json
import sys
from pathlib import Path
from sklearn.impute import KNNImputer
from sklearn.preprocessing import LabelEncoder


def impute_column(df, col, method, params=None):
    """
    Impute missing values in a specific column using the specified method.

    Args:
        df: DataFrame
        col: Column name
        method: Imputation method
        params: Additional parameters for the method

    Returns:
        Series with imputed values
    """
    series = df[col].copy()
    params = params or {}

    if method == 'mean':
        return series.fillna(series.mean())

    elif method == 'median':
        return series.fillna(series.median())

    elif method == 'mode':
        mode_value = series.mode()
        if len(mode_value) > 0:
            return series.fillna(mode_value[0])
        return series

    elif method == 'most_frequent':
        # Same as mode but explicitly for categorical
        most_frequent = series.value_counts().idxmax() if len(series.value_counts()) > 0 else None
        return series.fillna(most_frequent)

    elif method == 'constant':
        fill_value = params.get('fill_value', 'Unknown')
        return series.fillna(fill_value)

    elif method == 'forward_fill':
        return series.fillna(method='ffill')

    elif method == 'backward_fill':
        return series.fillna(method='bfill')

    elif method == 'interpolate':
        if pd.api.types.is_numeric_dtype(series):
            return series.interpolate(method='linear')
        else:
            return series.fillna(method='ffill')  # Fallback for non-numeric

    elif method == 'knn':
        # KNN imputation requires numeric data
        # For mixed datasets, we'll use KNN on numeric columns only
        return series  # Will be handled by batch KNN imputation

    elif method == 'drop_rows':
        # Mark for row deletion (handled at DataFrame level)
        return series

    elif method == 'drop_or_flag':
        # For columns with too many missing values
        # Option to create a missing indicator instead of dropping
        if params.get('create_indicator', False):
            return series
        return series

    else:
        print(f"Warning: Unknown imputation method '{method}' for column '{col}'. Skipping.")
        return series


def batch_knn_imputation(df, columns_for_knn, n_neighbors=5):
    """
    Perform KNN imputation on multiple numeric columns simultaneously.

    Args:
        df: DataFrame
        columns_for_knn: List of columns to impute using KNN
        n_neighbors: Number of neighbors for KNN

    Returns:
        DataFrame with KNN-imputed values
    """
    if not columns_for_knn:
        return df

    # Select only numeric columns for KNN
    numeric_cols = [col for col in columns_for_knn if pd.api.types.is_numeric_dtype(df[col])]

    if not numeric_cols:
        return df

    # Perform KNN imputation
    imputer = KNNImputer(n_neighbors=n_neighbors)
    df[numeric_cols] = imputer.fit_transform(df[numeric_cols])

    return df


def impute_missing_values(filepath, analysis_json=None, output_file=None, create_missing_indicators=False):
    """
    Automatically impute missing values based on analysis results.

    Args:
        filepath: Path to the CSV file
        analysis_json: Path to analysis JSON (optional, will analyze if not provided)
        output_file: Path to save imputed data (optional)
        create_missing_indicators: Whether to create binary columns indicating missingness

    Returns:
        DataFrame with imputed values and imputation report
    """
    # Load data
    df = pd.read_csv(filepath)
    original_rows = len(df)

    # Load or generate analysis
    if analysis_json and Path(analysis_json).exists():
        with open(analysis_json, 'r') as f:
            analysis = json.load(f)
    else:
        # Import and run analysis
        from analyze_missing_values import analyze_missing_values
        analysis = analyze_missing_values(filepath)

    # Track imputation actions
    imputation_log = {}
    columns_to_drop = []
    rows_to_drop_mask = pd.Series([False] * len(df))
    knn_columns = []

    # Create missing indicators if requested
    if create_missing_indicators:
        for col in analysis['column_analysis'].keys():
            indicator_col = f'{col}_was_missing'
            df[indicator_col] = df[col].isna().astype(int)

    # Process each column with missing values
    for col, col_analysis in analysis['column_analysis'].items():
        strategy = col_analysis['imputation_strategy']
        method = strategy['method']

        imputation_log[col] = {
            'method': method,
            'missing_before': col_analysis['missing_count'],
            'reasoning': strategy['reasoning']
        }

        if method == 'drop_or_flag':
            if col_analysis['missing_percentage'] > 70:
                columns_to_drop.append(col)
                imputation_log[col]['action'] = f"Dropped column ({col_analysis['missing_percentage']:.1f}% missing)"
            else:
                # Keep column, user can decide
                imputation_log[col]['action'] = f"Flagged for review ({col_analysis['missing_percentage']:.1f}% missing)"

        elif method == 'drop_rows':
            rows_to_drop_mask |= df[col].isna()
            imputation_log[col]['action'] = "Marked rows for deletion"

        elif method == 'knn':
            knn_columns.append(col)
            imputation_log[col]['action'] = "Queued for KNN imputation"

        elif method.startswith('constant:'):
            # Extract the constant value
            fill_value = method.split(':', 1)[1]
            df[col] = impute_column(df, col, 'constant', {'fill_value': fill_value})
            imputation_log[col]['action'] = f"Filled with constant: {fill_value}"
            imputation_log[col]['missing_after'] = df[col].isna().sum()

        else:
            # Standard imputation methods
            df[col] = impute_column(df, col, method)
            imputation_log[col]['action'] = f"Imputed using {method}"
            imputation_log[col]['missing_after'] = df[col].isna().sum()

    # Perform batch KNN imputation
    if knn_columns:
        print(f"Performing KNN imputation on {len(knn_columns)} columns...")
        df = batch_knn_imputation(df, knn_columns)
        for col in knn_columns:
            imputation_log[col]['action'] = "Imputed using KNN"
            imputation_log[col]['missing_after'] = df[col].isna().sum()

    # Drop columns marked for deletion
    if columns_to_drop:
        df = df.drop(columns=columns_to_drop)
        print(f"Dropped {len(columns_to_drop)} columns with excessive missing values")

    # Drop rows marked for deletion
    if rows_to_drop_mask.any():
        rows_to_drop = rows_to_drop_mask.sum()
        df = df[~rows_to_drop_mask].reset_index(drop=True)
        print(f"Dropped {rows_to_drop} rows with missing critical values")

    # Generate report
    report = {
        'input_file': str(filepath),
        'original_rows': original_rows,
        'final_rows': len(df),
        'rows_dropped': original_rows - len(df),
        'columns_dropped': len(columns_to_drop),
        'columns_imputed': len([c for c in imputation_log if 'missing_after' in imputation_log[c]]),
        'imputation_log': imputation_log
    }

    # Save imputed data
    if output_file:
        df.to_csv(output_file, index=False)
        print(f"\nImputed data saved to: {output_file}")
        report['output_file'] = str(output_file)

    return df, report


def print_imputation_report(report):
    """Print a formatted imputation report."""
    print("\n" + "="*80)
    print("IMPUTATION REPORT")
    print("="*80)
    print(f"\nInput file: {report['input_file']}")
    if 'output_file' in report:
        print(f"Output file: {report['output_file']}")

    print(f"\nData dimensions:")
    print(f"  - Original rows: {report['original_rows']:,}")
    print(f"  - Final rows: {report['final_rows']:,}")
    if report['rows_dropped'] > 0:
        print(f"  - Rows dropped: {report['rows_dropped']:,}")

    print(f"\nImputation summary:")
    print(f"  - Columns imputed: {report['columns_imputed']}")
    if report['columns_dropped'] > 0:
        print(f"  - Columns dropped: {report['columns_dropped']}")

    print("\n" + "-"*80)
    print("COLUMN-BY-COLUMN IMPUTATION LOG")
    print("-"*80)

    for col, log in report['imputation_log'].items():
        print(f"\n📊 Column: {col}")
        print(f"   Method: {log['method']}")
        print(f"   Missing before: {log['missing_before']}")
        if 'missing_after' in log:
            print(f"   Missing after: {log['missing_after']}")
        print(f"   Action: {log['action']}")
        print(f"   Reasoning: {log['reasoning']}")

    print("\n" + "="*80 + "\n")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python impute_missing_values.py <csv_file> [analysis_json] [output_file]")
        print("\nExample:")
        print("  python impute_missing_values.py data.csv")
        print("  python impute_missing_values.py data.csv analysis.json data_imputed.csv")
        sys.exit(1)

    filepath = sys.argv[1]
    analysis_json = sys.argv[2] if len(sys.argv) > 2 else None
    output_file = sys.argv[3] if len(sys.argv) > 3 else filepath.replace('.csv', '_imputed.csv')

    if not Path(filepath).exists():
        print(f"Error: File not found: {filepath}")
        sys.exit(1)

    print("Starting automatic imputation...")
    df_imputed, report = impute_missing_values(
        filepath,
        analysis_json=analysis_json,
        output_file=output_file,
        create_missing_indicators=False
    )

    print_imputation_report(report)

    # Save report as JSON
    report_json = output_file.replace('.csv', '_report.json')
    with open(report_json, 'w') as f:
        json.dump(report, f, indent=2)
    print(f"Detailed report saved to: {report_json}")
