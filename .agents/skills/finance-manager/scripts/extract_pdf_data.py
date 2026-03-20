#!/usr/bin/env python3
"""
Extract financial transaction data from PDF files and convert to CSV format.
"""

import sys
import csv
import re
from datetime import datetime


def extract_tables_from_pdf(pdf_path: str) -> list:
    """Extract table data from PDF using pdfplumber."""
    try:
        import pdfplumber
    except ImportError:
        print("Error: pdfplumber not installed. Install with: pip install pdfplumber --break-system-packages")
        sys.exit(1)
    
    all_transactions = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                if table:
                    # First row is usually headers
                    headers = table[0] if table else []
                    
                    # Process data rows
                    for row in table[1:]:
                        if row and len(row) >= 5:
                            # Skip empty rows or header rows
                            if not row[0] or 'Date' in str(row[0]):
                                continue
                            
                            try:
                                # Parse the row: [Date, Description, Income/Category, Type, Amount]
                                date_str = str(row[0]).strip()
                                description = str(row[1]).strip()
                                category = str(row[2]).strip()
                                trans_type = str(row[3]).strip()
                                amount_str = str(row[4]).strip().replace(',', '')
                                
                                # Parse date
                                date = datetime.strptime(date_str, '%b %d, %Y').strftime('%Y-%m-%d')
                                
                                # Parse amount
                                amount = float(amount_str)
                                
                                all_transactions.append({
                                    'Date': date,
                                    'Description': description,
                                    'Income': category,
                                    'Type': trans_type,
                                    'Amount': amount
                                })
                            except (ValueError, IndexError) as e:
                                continue
    
    return all_transactions



def save_to_csv(transactions: list, output_path: str):
    """Save transactions to CSV file."""
    if not transactions:
        print("No transactions found to save.")
        return
    
    fieldnames = ['Date', 'Description', 'Income', 'Type', 'Amount']
    
    with open(output_path, 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(transactions)
    
    print(f"Extracted {len(transactions)} transactions to {output_path}")


def main():
    if len(sys.argv) < 3:
        print("Usage: python extract_pdf_data.py <input.pdf> <output.csv>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    csv_path = sys.argv[2]
    
    print(f"Extracting data from {pdf_path}...")
    transactions = extract_tables_from_pdf(pdf_path)
    
    print("Saving to CSV...")
    save_to_csv(transactions, csv_path)


if __name__ == "__main__":
    main()
