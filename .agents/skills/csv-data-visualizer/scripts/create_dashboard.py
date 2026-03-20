#!/usr/bin/env python3
"""
CSV Dashboard Creator - Multi-plot dashboard generator
Creates comprehensive interactive dashboards with multiple visualizations
"""

import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import argparse
import sys
from pathlib import Path
import json


class DashboardCreator:
    """Create multi-plot dashboards from CSV data"""

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

    def create_auto_dashboard(self, output=None, max_plots=6):
        """Automatically create dashboard based on data types"""
        print("🔍 Analyzing data to create automatic dashboard...")

        numeric_cols = self.df.select_dtypes(include=['number']).columns.tolist()
        categorical_cols = self.df.select_dtypes(include=['object']).columns.tolist()

        plots = []

        # Add distribution plots for numeric columns (up to 2)
        for col in numeric_cols[:2]:
            plots.append(('histogram', col, None))

        # Add box plots for numeric columns grouped by first categorical (up to 2)
        if len(categorical_cols) > 0 and len(numeric_cols) > 0:
            for col in numeric_cols[:2]:
                plots.append(('box', col, categorical_cols[0]))

        # Add correlation heatmap if multiple numeric columns
        if len(numeric_cols) >= 2:
            plots.append(('correlation', None, None))

        # Add categorical distribution (up to 1)
        for col in categorical_cols[:1]:
            plots.append(('bar', col, None))

        # Limit to max_plots
        plots = plots[:max_plots]

        print(f"📊 Creating dashboard with {len(plots)} plots...")
        return self._create_dashboard(plots, output, title="Automatic Dashboard")

    def create_custom_dashboard(self, config_path, output=None):
        """Create dashboard from JSON configuration"""
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
        except Exception as e:
            print(f"✗ Error loading config: {e}", file=sys.stderr)
            sys.exit(1)

        plots = []
        for plot_config in config.get('plots', []):
            plot_type = plot_config.get('type')
            column = plot_config.get('column')
            group_by = plot_config.get('group_by')
            plots.append((plot_type, column, group_by))

        title = config.get('title', 'Custom Dashboard')
        return self._create_dashboard(plots, output, title=title)

    def _create_dashboard(self, plots, output, title="Dashboard"):
        """Create dashboard with specified plots"""
        n_plots = len(plots)

        # Determine grid layout
        if n_plots <= 2:
            rows, cols = 1, n_plots
        elif n_plots <= 4:
            rows, cols = 2, 2
        elif n_plots <= 6:
            rows, cols = 2, 3
        else:
            rows, cols = 3, 3

        # Create subplots
        fig = make_subplots(
            rows=rows,
            cols=cols,
            subplot_titles=[self._get_plot_title(p) for p in plots],
            vertical_spacing=0.12,
            horizontal_spacing=0.10
        )

        # Add each plot
        for idx, (plot_type, column, group_by) in enumerate(plots):
            row = idx // cols + 1
            col = idx % cols + 1

            try:
                self._add_plot_to_dashboard(fig, plot_type, column, group_by, row, col)
            except Exception as e:
                print(f"⚠ Warning: Could not create {plot_type} plot for {column}: {e}")

        # Update layout
        fig.update_layout(
            title_text=title,
            title_font_size=24,
            showlegend=True,
            height=400 * rows,
            width=1400
        )

        # Save dashboard
        if output is None:
            output = self.csv_path.parent / f"dashboard_{self.csv_path.stem}.html"
        else:
            output = Path(output)

        fig.write_html(str(output))
        print(f"✓ Dashboard saved: {output}")
        return str(output)

    def _get_plot_title(self, plot_info):
        """Generate plot title from plot info"""
        plot_type, column, group_by = plot_info

        if plot_type == 'histogram':
            return f"Distribution of {column}"
        elif plot_type == 'box':
            return f"{column} by {group_by}" if group_by else f"Box Plot: {column}"
        elif plot_type == 'scatter':
            return f"{column} vs {group_by}"
        elif plot_type == 'bar':
            return f"Count of {column}"
        elif plot_type == 'correlation':
            return "Correlation Matrix"
        else:
            return column or plot_type

    def _add_plot_to_dashboard(self, fig, plot_type, column, group_by, row, col):
        """Add a specific plot to the dashboard"""
        if plot_type == 'histogram':
            self._add_histogram(fig, column, row, col)
        elif plot_type == 'box':
            self._add_box_plot(fig, column, group_by, row, col)
        elif plot_type == 'scatter':
            self._add_scatter(fig, column, group_by, row, col)
        elif plot_type == 'bar':
            self._add_bar_chart(fig, column, row, col)
        elif plot_type == 'correlation':
            self._add_correlation_heatmap(fig, row, col)

    def _add_histogram(self, fig, column, row, col):
        """Add histogram to dashboard"""
        fig.add_trace(
            go.Histogram(x=self.df[column], name=column, showlegend=False),
            row=row, col=col
        )

    def _add_box_plot(self, fig, column, group_by, row, col):
        """Add box plot to dashboard"""
        if group_by and group_by in self.df.columns:
            for category in self.df[group_by].unique():
                data = self.df[self.df[group_by] == category][column]
                fig.add_trace(
                    go.Box(y=data, name=str(category)),
                    row=row, col=col
                )
        else:
            fig.add_trace(
                go.Box(y=self.df[column], name=column, showlegend=False),
                row=row, col=col
            )

    def _add_scatter(self, fig, x_col, y_col, row, col):
        """Add scatter plot to dashboard"""
        fig.add_trace(
            go.Scatter(
                x=self.df[x_col],
                y=self.df[y_col],
                mode='markers',
                name=f"{y_col} vs {x_col}",
                showlegend=False
            ),
            row=row, col=col
        )

    def _add_bar_chart(self, fig, column, row, col):
        """Add bar chart to dashboard"""
        value_counts = self.df[column].value_counts().head(10)
        fig.add_trace(
            go.Bar(x=value_counts.index, y=value_counts.values, name=column, showlegend=False),
            row=row, col=col
        )

    def _add_correlation_heatmap(self, fig, row, col):
        """Add correlation heatmap to dashboard"""
        numeric_df = self.df.select_dtypes(include=['number'])
        corr_matrix = numeric_df.corr()

        fig.add_trace(
            go.Heatmap(
                z=corr_matrix.values,
                x=corr_matrix.columns,
                y=corr_matrix.columns,
                colorscale='RdBu_r',
                zmid=0,
                showscale=True
            ),
            row=row, col=col
        )


def main():
    parser = argparse.ArgumentParser(
        description='Create interactive multi-plot dashboards from CSV data',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Auto-generate dashboard
  %(prog)s data.csv

  # Auto-generate with custom output
  %(prog)s data.csv -o my_dashboard.html

  # Create from config file
  %(prog)s data.csv --config dashboard_config.json

Dashboard Config JSON format:
{
  "title": "My Custom Dashboard",
  "plots": [
    {"type": "histogram", "column": "age"},
    {"type": "box", "column": "salary", "group_by": "department"},
    {"type": "scatter", "column": "height", "group_by": "weight"},
    {"type": "bar", "column": "category"},
    {"type": "correlation"}
  ]
}
        """
    )

    parser.add_argument('csv_file', help='Path to CSV file')
    parser.add_argument('-o', '--output', help='Output HTML file path')
    parser.add_argument('--config', help='JSON config file for custom dashboard')
    parser.add_argument('--max-plots', type=int, default=6,
                       help='Maximum number of plots in auto dashboard (default: 6)')

    args = parser.parse_args()

    # Create dashboard
    creator = DashboardCreator(args.csv_file)

    if args.config:
        creator.create_custom_dashboard(args.config, output=args.output)
    else:
        creator.create_auto_dashboard(output=args.output, max_plots=args.max_plots)


if __name__ == '__main__':
    main()
