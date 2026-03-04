#!/usr/bin/env python3
"""
CSV Data Profiler - Automatic data profiling and statistical analysis
Generates comprehensive reports about CSV data quality and statistics
"""

import pandas as pd
import numpy as np
import argparse
import sys
from pathlib import Path
import json
from datetime import datetime


class DataProfiler:
    """Automatic data profiling for CSV files"""

    def __init__(self, csv_path):
        """Initialize with CSV file path"""
        try:
            self.df = pd.read_csv(csv_path)
            self.csv_path = Path(csv_path)
            print(f"✓ Loaded CSV: {csv_path}")
        except Exception as e:
            print(f"✗ Error loading CSV: {e}", file=sys.stderr)
            sys.exit(1)

    def generate_profile(self, output_format='text'):
        """Generate comprehensive data profile"""
        profile = {
            'file_info': self._file_info(),
            'overview': self._overview(),
            'columns': self._column_analysis(),
            'missing_data': self._missing_data_analysis(),
            'numeric_summary': self._numeric_summary(),
            'categorical_summary': self._categorical_summary(),
            'data_quality': self._data_quality_checks()
        }

        if output_format == 'json':
            return json.dumps(profile, indent=2, default=str)
        elif output_format == 'html':
            return self._generate_html_report(profile)
        else:
            return self._generate_text_report(profile)

    def _file_info(self):
        """Basic file information"""
        return {
            'filename': self.csv_path.name,
            'file_size': f"{self.csv_path.stat().st_size / 1024:.2f} KB",
            'rows': len(self.df),
            'columns': len(self.df.columns)
        }

    def _overview(self):
        """Dataset overview"""
        memory_usage = self.df.memory_usage(deep=True).sum() / 1024 / 1024
        return {
            'shape': f"{self.df.shape[0]} rows × {self.df.shape[1]} columns",
            'memory_usage': f"{memory_usage:.2f} MB",
            'duplicate_rows': int(self.df.duplicated().sum()),
            'column_names': list(self.df.columns)
        }

    def _column_analysis(self):
        """Detailed column-by-column analysis"""
        columns_info = {}

        for col in self.df.columns:
            col_data = self.df[col]
            info = {
                'dtype': str(col_data.dtype),
                'non_null_count': int(col_data.notna().sum()),
                'null_count': int(col_data.isna().sum()),
                'null_percentage': f"{(col_data.isna().sum() / len(col_data) * 100):.2f}%",
                'unique_values': int(col_data.nunique()),
                'unique_percentage': f"{(col_data.nunique() / len(col_data) * 100):.2f}%"
            }

            # Add type-specific info
            if pd.api.types.is_numeric_dtype(col_data):
                info['min'] = float(col_data.min()) if not pd.isna(col_data.min()) else None
                info['max'] = float(col_data.max()) if not pd.isna(col_data.max()) else None
                info['mean'] = float(col_data.mean()) if not pd.isna(col_data.mean()) else None
                info['median'] = float(col_data.median()) if not pd.isna(col_data.median()) else None
                info['std'] = float(col_data.std()) if not pd.isna(col_data.std()) else None
            elif pd.api.types.is_object_dtype(col_data):
                # String/categorical analysis
                if col_data.notna().sum() > 0:
                    info['most_common'] = col_data.value_counts().head(5).to_dict()
                    info['avg_length'] = float(col_data.astype(str).str.len().mean())

            columns_info[col] = info

        return columns_info

    def _missing_data_analysis(self):
        """Analyze missing data patterns"""
        missing = self.df.isna().sum()
        missing_pct = (missing / len(self.df)) * 100

        missing_data = {}
        for col in missing[missing > 0].index:
            missing_data[col] = {
                'count': int(missing[col]),
                'percentage': f"{missing_pct[col]:.2f}%"
            }

        return {
            'total_missing_values': int(self.df.isna().sum().sum()),
            'columns_with_missing': missing_data,
            'complete_rows': int(self.df.notna().all(axis=1).sum()),
            'rows_with_any_missing': int(self.df.isna().any(axis=1).sum())
        }

    def _numeric_summary(self):
        """Statistical summary for numeric columns"""
        numeric_cols = self.df.select_dtypes(include=['number']).columns

        if len(numeric_cols) == 0:
            return {}

        summary = {}
        for col in numeric_cols:
            col_data = self.df[col].dropna()
            if len(col_data) > 0:
                summary[col] = {
                    'count': int(len(col_data)),
                    'mean': float(col_data.mean()),
                    'std': float(col_data.std()),
                    'min': float(col_data.min()),
                    '25%': float(col_data.quantile(0.25)),
                    '50%': float(col_data.quantile(0.50)),
                    '75%': float(col_data.quantile(0.75)),
                    'max': float(col_data.max()),
                    'skewness': float(col_data.skew()),
                    'kurtosis': float(col_data.kurtosis())
                }

        return summary

    def _categorical_summary(self):
        """Summary for categorical/text columns"""
        categorical_cols = self.df.select_dtypes(include=['object']).columns

        if len(categorical_cols) == 0:
            return {}

        summary = {}
        for col in categorical_cols:
            col_data = self.df[col].dropna()
            if len(col_data) > 0:
                value_counts = col_data.value_counts()
                summary[col] = {
                    'unique_values': int(col_data.nunique()),
                    'most_frequent': str(value_counts.index[0]) if len(value_counts) > 0 else None,
                    'most_frequent_count': int(value_counts.iloc[0]) if len(value_counts) > 0 else None,
                    'least_frequent': str(value_counts.index[-1]) if len(value_counts) > 0 else None,
                    'least_frequent_count': int(value_counts.iloc[-1]) if len(value_counts) > 0 else None,
                    'top_5_values': value_counts.head(5).to_dict()
                }

        return summary

    def _data_quality_checks(self):
        """Perform data quality checks"""
        issues = []

        # Check for high missing data
        missing_pct = (self.df.isna().sum() / len(self.df)) * 100
        high_missing = missing_pct[missing_pct > 50]
        if len(high_missing) > 0:
            issues.append({
                'type': 'HIGH_MISSING_DATA',
                'severity': 'WARNING',
                'columns': list(high_missing.index),
                'message': f"{len(high_missing)} column(s) have >50% missing data"
            })

        # Check for duplicate rows
        duplicates = self.df.duplicated().sum()
        if duplicates > 0:
            issues.append({
                'type': 'DUPLICATE_ROWS',
                'severity': 'INFO',
                'count': int(duplicates),
                'message': f"{duplicates} duplicate rows found"
            })

        # Check for constant columns
        constant_cols = [col for col in self.df.columns if self.df[col].nunique() == 1]
        if len(constant_cols) > 0:
            issues.append({
                'type': 'CONSTANT_COLUMNS',
                'severity': 'WARNING',
                'columns': constant_cols,
                'message': f"{len(constant_cols)} column(s) have constant values"
            })

        # Check for high cardinality
        for col in self.df.select_dtypes(include=['object']).columns:
            unique_ratio = self.df[col].nunique() / len(self.df)
            if unique_ratio > 0.95:
                issues.append({
                    'type': 'HIGH_CARDINALITY',
                    'severity': 'INFO',
                    'column': col,
                    'message': f"Column '{col}' has very high cardinality ({unique_ratio*100:.1f}%)"
                })

        return issues

    def _generate_text_report(self, profile):
        """Generate human-readable text report"""
        lines = []
        lines.append("=" * 80)
        lines.append("CSV DATA PROFILE REPORT")
        lines.append("=" * 80)
        lines.append("")

        # File Info
        lines.append("FILE INFORMATION")
        lines.append("-" * 80)
        for key, value in profile['file_info'].items():
            lines.append(f"{key.replace('_', ' ').title()}: {value}")
        lines.append("")

        # Overview
        lines.append("DATASET OVERVIEW")
        lines.append("-" * 80)
        for key, value in profile['overview'].items():
            if key != 'column_names':
                lines.append(f"{key.replace('_', ' ').title()}: {value}")
        lines.append("")

        # Missing Data
        lines.append("MISSING DATA ANALYSIS")
        lines.append("-" * 80)
        lines.append(f"Total Missing Values: {profile['missing_data']['total_missing_values']}")
        lines.append(f"Complete Rows: {profile['missing_data']['complete_rows']}")
        lines.append(f"Rows with Missing: {profile['missing_data']['rows_with_any_missing']}")
        if profile['missing_data']['columns_with_missing']:
            lines.append("\nColumns with Missing Data:")
            for col, info in profile['missing_data']['columns_with_missing'].items():
                lines.append(f"  - {col}: {info['count']} ({info['percentage']})")
        lines.append("")

        # Numeric Summary
        if profile['numeric_summary']:
            lines.append("NUMERIC COLUMNS SUMMARY")
            lines.append("-" * 80)
            for col, stats in profile['numeric_summary'].items():
                lines.append(f"\n{col}:")
                for stat, value in stats.items():
                    lines.append(f"  {stat}: {value:.4f}" if isinstance(value, float) else f"  {stat}: {value}")
            lines.append("")

        # Categorical Summary
        if profile['categorical_summary']:
            lines.append("CATEGORICAL COLUMNS SUMMARY")
            lines.append("-" * 80)
            for col, stats in profile['categorical_summary'].items():
                lines.append(f"\n{col}:")
                for key, value in stats.items():
                    if key != 'top_5_values':
                        lines.append(f"  {key.replace('_', ' ').title()}: {value}")
            lines.append("")

        # Data Quality
        if profile['data_quality']:
            lines.append("DATA QUALITY ISSUES")
            lines.append("-" * 80)
            for issue in profile['data_quality']:
                lines.append(f"[{issue['severity']}] {issue['message']}")
            lines.append("")

        lines.append("=" * 80)
        lines.append(f"Report generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("=" * 80)

        return "\n".join(lines)

    def _generate_html_report(self, profile):
        """Generate HTML report"""
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Data Profile Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        h1 {{ color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }}
        h2 {{ color: #555; border-bottom: 2px solid #ddd; padding-bottom: 8px; margin-top: 30px; }}
        .info-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }}
        .info-card {{ background: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; }}
        .info-card strong {{ display: block; color: #666; font-size: 0.9em; margin-bottom: 5px; }}
        .info-card span {{ font-size: 1.2em; color: #333; }}
        table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }}
        th {{ background: #4CAF50; color: white; }}
        tr:hover {{ background: #f5f5f5; }}
        .issue {{ padding: 10px; margin: 10px 0; border-left: 4px solid; }}
        .issue.WARNING {{ background: #fff3cd; border-color: #ffc107; }}
        .issue.INFO {{ background: #d1ecf1; border-color: #17a2b8; }}
        .issue.ERROR {{ background: #f8d7da; border-color: #dc3545; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>CSV Data Profile Report</h1>
        <p><strong>Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>

        <h2>File Information</h2>
        <div class="info-grid">
            <div class="info-card"><strong>Filename</strong><span>{profile['file_info']['filename']}</span></div>
            <div class="info-card"><strong>File Size</strong><span>{profile['file_info']['file_size']}</span></div>
            <div class="info-card"><strong>Rows</strong><span>{profile['file_info']['rows']:,}</span></div>
            <div class="info-card"><strong>Columns</strong><span>{profile['file_info']['columns']}</span></div>
        </div>

        <h2>Dataset Overview</h2>
        <div class="info-grid">
            <div class="info-card"><strong>Shape</strong><span>{profile['overview']['shape']}</span></div>
            <div class="info-card"><strong>Memory Usage</strong><span>{profile['overview']['memory_usage']}</span></div>
            <div class="info-card"><strong>Duplicate Rows</strong><span>{profile['overview']['duplicate_rows']}</span></div>
        </div>

        <h2>Missing Data Analysis</h2>
        <div class="info-grid">
            <div class="info-card"><strong>Total Missing</strong><span>{profile['missing_data']['total_missing_values']:,}</span></div>
            <div class="info-card"><strong>Complete Rows</strong><span>{profile['missing_data']['complete_rows']:,}</span></div>
            <div class="info-card"><strong>Rows with Missing</strong><span>{profile['missing_data']['rows_with_any_missing']:,}</span></div>
        </div>

        <h2>Data Quality Issues</h2>
        {''.join([f'<div class="issue {issue["severity"]}">[{issue["severity"]}] {issue["message"]}</div>' for issue in profile['data_quality']]) if profile['data_quality'] else '<p>No issues detected</p>'}
    </div>
</body>
</html>
"""
        return html


def main():
    parser = argparse.ArgumentParser(
        description='Generate comprehensive data profile for CSV files',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument('csv_file', help='Path to CSV file')
    parser.add_argument('-f', '--format', choices=['text', 'json', 'html'],
                       default='text', help='Output format (default: text)')
    parser.add_argument('-o', '--output', help='Output file path (default: print to stdout)')

    args = parser.parse_args()

    # Generate profile
    profiler = DataProfiler(args.csv_file)
    report = profiler.generate_profile(output_format=args.format)

    # Output
    if args.output:
        output_path = Path(args.output)
        output_path.write_text(report)
        print(f"✓ Report saved: {output_path}")
    else:
        print(report)


if __name__ == '__main__':
    main()
