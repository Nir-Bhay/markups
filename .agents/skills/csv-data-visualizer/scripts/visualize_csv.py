#!/usr/bin/env python3
"""
CSV Data Visualizer - Interactive visualization tool using Plotly
Supports statistical plots, relationships, time series, and categorical data
"""

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import argparse
import sys
from pathlib import Path
import json


class CSVVisualizer:
    """Main visualization class for CSV data"""

    def __init__(self, csv_path):
        """Initialize with CSV file path"""
        try:
            self.df = pd.read_csv(csv_path)
            self.csv_path = Path(csv_path)
            print(f"✓ Loaded CSV: {csv_path}")
            print(f"  Rows: {len(self.df)}, Columns: {len(self.df.columns)}")
        except Exception as e:
            print(f"✗ Error loading CSV: {e}", file=sys.stderr)
            sys.exit(1)

    def histogram(self, column, bins=30, output=None):
        """Create histogram for a numeric column"""
        fig = px.histogram(
            self.df,
            x=column,
            nbins=bins,
            title=f"Distribution of {column}",
            labels={column: column, 'count': 'Frequency'}
        )
        fig.update_layout(showlegend=False)
        return self._save_figure(fig, output, f"histogram_{column}")

    def box_plot(self, column, group_by=None, output=None):
        """Create box plot for numeric column, optionally grouped"""
        if group_by:
            fig = px.box(
                self.df,
                x=group_by,
                y=column,
                title=f"Box Plot: {column} by {group_by}"
            )
        else:
            fig = px.box(
                self.df,
                y=column,
                title=f"Box Plot: {column}"
            )
        return self._save_figure(fig, output, f"boxplot_{column}")

    def scatter_plot(self, x_col, y_col, color=None, size=None, output=None):
        """Create scatter plot showing relationship between two variables"""
        fig = px.scatter(
            self.df,
            x=x_col,
            y=y_col,
            color=color,
            size=size,
            title=f"{y_col} vs {x_col}",
            trendline="ols" if color is None else None
        )
        return self._save_figure(fig, output, f"scatter_{x_col}_{y_col}")

    def correlation_heatmap(self, columns=None, output=None):
        """Create correlation heatmap for numeric columns"""
        if columns:
            numeric_df = self.df[columns]
        else:
            numeric_df = self.df.select_dtypes(include=['number'])

        corr_matrix = numeric_df.corr()

        fig = px.imshow(
            corr_matrix,
            text_auto='.2f',
            aspect="auto",
            color_continuous_scale='RdBu_r',
            title="Correlation Heatmap"
        )
        return self._save_figure(fig, output, "correlation_heatmap")

    def line_chart(self, x_col, y_cols, output=None):
        """Create line chart for time series or sequential data"""
        if isinstance(y_cols, str):
            y_cols = [y_cols]

        fig = go.Figure()
        for y_col in y_cols:
            fig.add_trace(go.Scatter(
                x=self.df[x_col],
                y=self.df[y_col],
                mode='lines+markers',
                name=y_col
            ))

        fig.update_layout(
            title=f"Time Series: {', '.join(y_cols)}",
            xaxis_title=x_col,
            yaxis_title="Value"
        )
        return self._save_figure(fig, output, f"timeseries_{x_col}")

    def bar_chart(self, x_col, y_col=None, output=None):
        """Create bar chart for categorical data"""
        if y_col is None:
            # Count occurrences
            value_counts = self.df[x_col].value_counts().reset_index()
            value_counts.columns = [x_col, 'count']
            fig = px.bar(
                value_counts,
                x=x_col,
                y='count',
                title=f"Count of {x_col}"
            )
        else:
            fig = px.bar(
                self.df,
                x=x_col,
                y=y_col,
                title=f"{y_col} by {x_col}"
            )
        return self._save_figure(fig, output, f"bar_{x_col}")

    def pie_chart(self, column, output=None):
        """Create pie chart for categorical data"""
        value_counts = self.df[column].value_counts().reset_index()
        value_counts.columns = [column, 'count']

        fig = px.pie(
            value_counts,
            values='count',
            names=column,
            title=f"Distribution of {column}"
        )
        return self._save_figure(fig, output, f"pie_{column}")

    def violin_plot(self, column, group_by=None, output=None):
        """Create violin plot showing distribution with probability density"""
        if group_by:
            fig = px.violin(
                self.df,
                x=group_by,
                y=column,
                box=True,
                title=f"Violin Plot: {column} by {group_by}"
            )
        else:
            fig = px.violin(
                self.df,
                y=column,
                box=True,
                title=f"Violin Plot: {column}"
            )
        return self._save_figure(fig, output, f"violin_{column}")

    def _save_figure(self, fig, output_path, default_name):
        """Save figure to file"""
        if output_path is None:
            output_path = self.csv_path.parent / f"{default_name}.html"
        else:
            output_path = Path(output_path)

        # Determine format from extension
        suffix = output_path.suffix.lower()

        if suffix == '.html':
            fig.write_html(str(output_path))
        elif suffix in ['.png', '.jpg', '.jpeg', '.svg', '.pdf']:
            fig.write_image(str(output_path))
        else:
            # Default to HTML
            output_path = output_path.with_suffix('.html')
            fig.write_html(str(output_path))

        print(f"✓ Saved: {output_path}")
        return str(output_path)


def main():
    parser = argparse.ArgumentParser(
        description='Create interactive visualizations from CSV data',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Histogram of a column
  %(prog)s data.csv --histogram age --bins 20

  # Scatter plot with trend line
  %(prog)s data.csv --scatter height weight

  # Box plot grouped by category
  %(prog)s data.csv --boxplot salary --group-by department

  # Correlation heatmap
  %(prog)s data.csv --correlation

  # Time series line chart
  %(prog)s data.csv --line date "sales,revenue"

  # Bar chart of categories
  %(prog)s data.csv --bar category

  # Pie chart
  %(prog)s data.csv --pie region
        """
    )

    parser.add_argument('csv_file', help='Path to CSV file')
    parser.add_argument('-o', '--output', help='Output file path')

    # Visualization types
    parser.add_argument('--histogram', metavar='COLUMN', help='Create histogram')
    parser.add_argument('--bins', type=int, default=30, help='Number of bins for histogram')
    parser.add_argument('--boxplot', metavar='COLUMN', help='Create box plot')
    parser.add_argument('--violin', metavar='COLUMN', help='Create violin plot')
    parser.add_argument('--scatter', nargs=2, metavar=('X', 'Y'), help='Create scatter plot')
    parser.add_argument('--line', nargs=2, metavar=('X', 'Y'), help='Create line chart (Y can be comma-separated)')
    parser.add_argument('--bar', metavar='COLUMN', help='Create bar chart')
    parser.add_argument('--pie', metavar='COLUMN', help='Create pie chart')
    parser.add_argument('--correlation', action='store_true', help='Create correlation heatmap')

    # Optional parameters
    parser.add_argument('--group-by', help='Column to group by (for box/violin plots)')
    parser.add_argument('--color', help='Column for color encoding (scatter plot)')
    parser.add_argument('--size', help='Column for size encoding (scatter plot)')

    args = parser.parse_args()

    # Initialize visualizer
    viz = CSVVisualizer(args.csv_file)

    # Create requested visualization
    if args.histogram:
        viz.histogram(args.histogram, bins=args.bins, output=args.output)
    elif args.boxplot:
        viz.box_plot(args.boxplot, group_by=args.group_by, output=args.output)
    elif args.violin:
        viz.violin_plot(args.violin, group_by=args.group_by, output=args.output)
    elif args.scatter:
        viz.scatter_plot(args.scatter[0], args.scatter[1],
                        color=args.color, size=args.size, output=args.output)
    elif args.line:
        y_cols = args.line[1].split(',')
        viz.line_chart(args.line[0], y_cols, output=args.output)
    elif args.bar:
        viz.bar_chart(args.bar, output=args.output)
    elif args.pie:
        viz.pie_chart(args.pie, output=args.output)
    elif args.correlation:
        viz.correlation_heatmap(output=args.output)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == '__main__':
    main()
