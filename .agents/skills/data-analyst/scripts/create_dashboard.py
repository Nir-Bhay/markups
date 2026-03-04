#!/usr/bin/env python3
"""
Create an interactive Plotly Dash dashboard for data visualization and trend analysis.
"""

import pandas as pd
import numpy as np
import sys
import json
from pathlib import Path
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import dash
from dash import dcc, html, Input, Output, callback
import dash_bootstrap_components as dbc


def detect_time_column(df):
    """Detect potential time/date columns in the dataframe."""
    time_cols = []
    for col in df.columns:
        # Check if column is datetime type
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            time_cols.append(col)
        # Try to parse as datetime
        elif pd.api.types.is_object_dtype(df[col]):
            try:
                pd.to_datetime(df[col])
                time_cols.append(col)
            except:
                pass
    return time_cols


def detect_numeric_columns(df):
    """Get all numeric columns suitable for visualization."""
    return [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]


def detect_categorical_columns(df, max_categories=20):
    """Get categorical columns with reasonable cardinality."""
    cat_cols = []
    for col in df.columns:
        if pd.api.types.is_object_dtype(df[col]) or pd.api.types.is_categorical_dtype(df[col]):
            if df[col].nunique() <= max_categories:
                cat_cols.append(col)
    return cat_cols


def create_time_series_plot(df, time_col, numeric_cols):
    """Create time series visualization for trend analysis."""
    # Convert time column to datetime
    df[time_col] = pd.to_datetime(df[time_col])
    df = df.sort_values(time_col)

    # Create subplot for each numeric column
    n_cols = len(numeric_cols)
    fig = make_subplots(
        rows=min(n_cols, 4),
        cols=1,
        subplot_titles=[f"{col} Over Time" for col in numeric_cols[:4]],
        vertical_spacing=0.1
    )

    for idx, col in enumerate(numeric_cols[:4]):  # Limit to 4 for readability
        row = idx + 1
        fig.add_trace(
            go.Scatter(
                x=df[time_col],
                y=df[col],
                mode='lines+markers',
                name=col,
                line=dict(width=2),
                marker=dict(size=4)
            ),
            row=row,
            col=1
        )

    fig.update_layout(
        height=300 * min(n_cols, 4),
        showlegend=True,
        title_text="Time Series Trends",
        hovermode='x unified'
    )

    fig.update_xaxes(title_text="Date", row=min(n_cols, 4), col=1)

    return fig


def create_distribution_plots(df, numeric_cols):
    """Create distribution plots (histograms and box plots)."""
    n_cols = len(numeric_cols)
    cols_per_row = 2
    n_rows = (n_cols + cols_per_row - 1) // cols_per_row

    fig = make_subplots(
        rows=n_rows,
        cols=cols_per_row,
        subplot_titles=[col for col in numeric_cols],
        vertical_spacing=0.1,
        horizontal_spacing=0.1
    )

    for idx, col in enumerate(numeric_cols):
        row = (idx // cols_per_row) + 1
        col_pos = (idx % cols_per_row) + 1

        fig.add_trace(
            go.Histogram(
                x=df[col],
                name=col,
                nbinsx=30,
                marker_color='lightblue',
                opacity=0.7
            ),
            row=row,
            col=col_pos
        )

    fig.update_layout(
        height=300 * n_rows,
        showlegend=False,
        title_text="Distribution Analysis"
    )

    return fig


def create_correlation_heatmap(df, numeric_cols):
    """Create correlation heatmap for numeric columns."""
    if len(numeric_cols) < 2:
        return None

    corr_matrix = df[numeric_cols].corr()

    fig = go.Figure(data=go.Heatmap(
        z=corr_matrix.values,
        x=corr_matrix.columns,
        y=corr_matrix.columns,
        colorscale='RdBu',
        zmid=0,
        text=corr_matrix.values.round(2),
        texttemplate='%{text}',
        textfont={"size": 10},
        colorbar=dict(title="Correlation")
    ))

    fig.update_layout(
        title="Correlation Heatmap",
        height=max(400, len(numeric_cols) * 40),
        xaxis={'side': 'bottom'}
    )

    return fig


def create_categorical_analysis(df, cat_cols, numeric_col=None):
    """Create categorical analysis plots."""
    if not cat_cols:
        return None

    n_cols = len(cat_cols)
    fig = make_subplots(
        rows=n_cols,
        cols=1,
        subplot_titles=[f"Distribution of {col}" for col in cat_cols],
        vertical_spacing=0.1
    )

    for idx, col in enumerate(cat_cols):
        row = idx + 1
        value_counts = df[col].value_counts().head(10)  # Top 10 categories

        fig.add_trace(
            go.Bar(
                x=value_counts.index,
                y=value_counts.values,
                name=col,
                marker_color='steelblue'
            ),
            row=row,
            col=1
        )

    fig.update_layout(
        height=300 * n_cols,
        showlegend=False,
        title_text="Categorical Variable Analysis"
    )

    return fig


def create_scatter_matrix(df, numeric_cols):
    """Create scatter plot matrix for relationships between variables."""
    if len(numeric_cols) < 2:
        return None

    # Limit to 5 columns for readability
    cols_to_plot = numeric_cols[:5]

    fig = px.scatter_matrix(
        df,
        dimensions=cols_to_plot,
        title="Scatter Plot Matrix - Variable Relationships"
    )

    fig.update_traces(diagonal_visible=False, showupperhalf=False)
    fig.update_layout(height=800)

    return fig


def create_summary_statistics_table(df):
    """Create a summary statistics table."""
    numeric_cols = detect_numeric_columns(df)

    if not numeric_cols:
        return None

    stats_df = df[numeric_cols].describe().round(2).T
    stats_df['missing'] = df[numeric_cols].isna().sum()
    stats_df['missing_pct'] = (stats_df['missing'] / len(df) * 100).round(2)

    fig = go.Figure(data=[go.Table(
        header=dict(
            values=['Variable'] + list(stats_df.columns),
            fill_color='paleturquoise',
            align='left',
            font=dict(size=12, color='black')
        ),
        cells=dict(
            values=[stats_df.index] + [stats_df[col] for col in stats_df.columns],
            fill_color='lavender',
            align='left',
            font=dict(size=11)
        )
    )])

    fig.update_layout(
        title="Summary Statistics",
        height=min(600, 50 + len(numeric_cols) * 30)
    )

    return fig


def build_dashboard(filepath, output_dir=None, port=8050):
    """
    Build and launch an interactive Plotly Dash dashboard.

    Args:
        filepath: Path to the CSV file
        output_dir: Directory to save dashboard files (optional)
        port: Port to run the dashboard server (default: 8050)
    """
    # Load data
    df = pd.read_csv(filepath)

    # Detect column types
    numeric_cols = detect_numeric_columns(df)
    cat_cols = detect_categorical_columns(df)
    time_cols = detect_time_column(df)

    print(f"\nDataset loaded: {len(df)} rows, {len(df.columns)} columns")
    print(f"Numeric columns: {len(numeric_cols)}")
    print(f"Categorical columns: {len(cat_cols)}")
    print(f"Time columns: {len(time_cols)}")

    # Create visualizations
    plots = {}

    # Summary statistics
    plots['summary'] = create_summary_statistics_table(df)

    # Time series (if time column exists)
    if time_cols and numeric_cols:
        plots['timeseries'] = create_time_series_plot(df, time_cols[0], numeric_cols)

    # Distribution plots
    if numeric_cols:
        plots['distributions'] = create_distribution_plots(df, numeric_cols[:6])

    # Correlation heatmap
    if len(numeric_cols) >= 2:
        plots['correlation'] = create_correlation_heatmap(df, numeric_cols)

    # Categorical analysis
    if cat_cols:
        plots['categorical'] = create_categorical_analysis(df, cat_cols[:5])

    # Scatter matrix
    if len(numeric_cols) >= 2:
        plots['scatter_matrix'] = create_scatter_matrix(df, numeric_cols)

    # Initialize Dash app
    app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])

    # Create layout
    app.layout = dbc.Container([
        dbc.Row([
            dbc.Col([
                html.H1("Data Analysis Dashboard", className="text-center mb-4"),
                html.Hr()
            ])
        ]),

        # Dataset info
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H4("Dataset Overview", className="card-title"),
                        html.P(f"File: {Path(filepath).name}"),
                        html.P(f"Rows: {len(df):,} | Columns: {len(df.columns)}"),
                        html.P(f"Numeric: {len(numeric_cols)} | Categorical: {len(cat_cols)} | Time: {len(time_cols)}")
                    ])
                ], className="mb-4")
            ])
        ]),

        # Summary statistics
        dbc.Row([
            dbc.Col([
                dcc.Graph(figure=plots['summary']) if plots.get('summary') else html.Div()
            ])
        ], className="mb-4"),

        # Time series
        dbc.Row([
            dbc.Col([
                dcc.Graph(figure=plots['timeseries']) if plots.get('timeseries') else html.Div()
            ])
        ], className="mb-4") if plots.get('timeseries') else html.Div(),

        # Distributions
        dbc.Row([
            dbc.Col([
                dcc.Graph(figure=plots['distributions']) if plots.get('distributions') else html.Div()
            ])
        ], className="mb-4"),

        # Correlation heatmap
        dbc.Row([
            dbc.Col([
                dcc.Graph(figure=plots['correlation']) if plots.get('correlation') else html.Div()
            ])
        ], className="mb-4") if plots.get('correlation') else html.Div(),

        # Categorical analysis
        dbc.Row([
            dbc.Col([
                dcc.Graph(figure=plots['categorical']) if plots.get('categorical') else html.Div()
            ])
        ], className="mb-4") if plots.get('categorical') else html.Div(),

        # Scatter matrix
        dbc.Row([
            dbc.Col([
                dcc.Graph(figure=plots['scatter_matrix']) if plots.get('scatter_matrix') else html.Div()
            ])
        ], className="mb-4") if plots.get('scatter_matrix') else html.Div(),

        # Footer
        dbc.Row([
            dbc.Col([
                html.Hr(),
                html.P("Interactive Data Analysis Dashboard | Generated with Plotly Dash",
                       className="text-center text-muted")
            ])
        ])
    ], fluid=True)

    # Save standalone HTML if output_dir specified
    if output_dir:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        # Save individual plots as HTML
        for plot_name, fig in plots.items():
            if fig:
                html_file = output_dir / f"{plot_name}.html"
                fig.write_html(html_file)
                print(f"Saved: {html_file}")

        print(f"\nStatic visualizations saved to: {output_dir}")

    # Run server
    print(f"\n{'='*80}")
    print(f"Starting dashboard server...")
    print(f"Access the dashboard at: http://127.0.0.1:{port}")
    print(f"Press Ctrl+C to stop the server")
    print(f"{'='*80}\n")

    app.run_server(debug=False, port=port)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python create_dashboard.py <csv_file> [output_dir] [port]")
        print("\nExample:")
        print("  python create_dashboard.py data.csv")
        print("  python create_dashboard.py data.csv ./visualizations 8050")
        sys.exit(1)

    filepath = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else None
    port = int(sys.argv[3]) if len(sys.argv) > 3 else 8050

    if not Path(filepath).exists():
        print(f"Error: File not found: {filepath}")
        sys.exit(1)

    build_dashboard(filepath, output_dir, port)
