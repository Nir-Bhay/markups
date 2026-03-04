# Missing Value Imputation Methods Reference

This document provides detailed information about various imputation strategies and when to use them.

## Overview

Missing data is a common challenge in data analysis. The choice of imputation method significantly impacts analysis quality and should be based on:
- The type of data (numeric, categorical, temporal)
- The pattern of missingness (random, systematic)
- The percentage of missing values
- The relationship between variables

## Imputation Methods

### 1. Mean Imputation

**Description**: Replace missing values with the arithmetic mean of non-missing values.

**Best for**:
- Normally distributed numeric data
- Low to moderate missing rates (<20%)
- Variables without strong relationships to others

**Advantages**:
- Simple and fast
- Maintains sample size
- Preserves mean of the distribution

**Disadvantages**:
- Reduces variance
- Distorts correlations
- Not suitable for skewed distributions

**Example use case**: Imputing missing temperature readings, height measurements, or test scores.

---

### 2. Median Imputation

**Description**: Replace missing values with the median of non-missing values.

**Best for**:
- Skewed numeric distributions
- Data with outliers
- Ordinal data

**Advantages**:
- Robust to outliers
- Works well with skewed data
- Simple to implement

**Disadvantages**:
- Reduces variance
- May not preserve relationships between variables

**Example use case**: Imputing income data, house prices, or any right-skewed distribution.

---

### 3. Mode Imputation

**Description**: Replace missing values with the most frequent value (mode).

**Best for**:
- Categorical variables
- Binary variables
- Low-cardinality discrete variables

**Advantages**:
- Appropriate for categorical data
- Maintains most common pattern
- Simple interpretation

**Disadvantages**:
- May introduce bias if mode is not truly representative
- Reduces variability

**Example use case**: Imputing product categories, gender, yes/no responses.

---

### 4. Constant Value Imputation

**Description**: Replace missing values with a predefined constant (e.g., "Unknown", 0, -999).

**Best for**:
- High-cardinality categorical variables
- When missingness itself is informative
- Text fields

**Advantages**:
- Makes missingness explicit
- Useful for categorical analysis
- Simple to implement

**Disadvantages**:
- May create artificial category
- Not suitable for numeric analysis without transformation

**Example use case**: Imputing missing comments, optional survey fields, or product descriptions.

---

### 5. Forward Fill (LOCF - Last Observation Carried Forward)

**Description**: Replace missing values with the last observed value in sequence.

**Best for**:
- Time series data
- Sequential measurements
- Slowly changing variables

**Advantages**:
- Preserves temporal patterns
- Logical for continuous processes
- Maintains smooth transitions

**Disadvantages**:
- Assumes stability over time
- Can propagate measurement errors
- Not suitable for volatile data

**Example use case**: Imputing stock prices, sensor readings, or patient vital signs.

---

### 6. Backward Fill (NOCB - Next Observation Carried Backward)

**Description**: Replace missing values with the next observed value in sequence.

**Best for**:
- Time series with forward-looking data
- When future values are more relevant

**Advantages**:
- Useful for certain temporal patterns
- Complements forward fill

**Disadvantages**:
- Less intuitive than forward fill
- May not reflect actual process

**Example use case**: Backfilling start dates, retroactive categorizations.

---

### 7. Interpolation

**Description**: Estimate missing values based on surrounding values using mathematical functions.

**Types**:
- Linear interpolation: Straight line between points
- Polynomial interpolation: Curved line fitting
- Spline interpolation: Smooth piecewise curves

**Best for**:
- Time series with smooth trends
- Numeric sequences
- Data with clear patterns

**Advantages**:
- More sophisticated than forward/backward fill
- Preserves trends
- Can capture non-linear patterns

**Disadvantages**:
- Requires ordered data
- Can be unstable at boundaries
- May not work for irregular patterns

**Example use case**: Filling gaps in temperature time series, smoothing measurement data.

---

### 8. KNN (K-Nearest Neighbors) Imputation

**Description**: Impute missing values using weighted average of K most similar observations.

**Best for**:
- Multivariate numeric data
- When variables are correlated
- Complex missing patterns

**Advantages**:
- Considers relationships between variables
- More accurate than univariate methods
- Preserves correlation structure

**Disadvantages**:
- Computationally expensive
- Requires choosing K parameter
- Sensitive to feature scaling

**Parameters**:
- `n_neighbors`: Number of neighbors (typically 3-10)
- `weights`: 'uniform' or 'distance'

**Example use case**: Imputing medical measurements, sensor arrays, multivariate financial data.

---

### 9. Multiple Imputation by Chained Equations (MICE)

**Description**: Iterative imputation using regression models for each variable.

**Best for**:
- Complex datasets
- Multiple variables with missing values
- When uncertainty estimation is important

**Advantages**:
- Produces multiple complete datasets
- Accounts for uncertainty
- Flexible with different variable types

**Disadvantages**:
- Computationally intensive
- Complex to implement
- Requires statistical expertise

**Example use case**: Academic research, medical studies, survey data analysis.

---

### 10. Dropping Rows/Columns

**Description**: Remove observations or variables with missing values.

**Best for**:
- Small amounts of missing data (<5%)
- Missing completely at random (MCAR)
- When imputation may introduce bias

**Dropping Rows when**:
- Critical variables are missing (e.g., ID, key outcome)
- Missing rate per row is very high
- Dataset is large enough to afford loss

**Dropping Columns when**:
- Missing rate >50-70%
- Variable is not critical to analysis
- Imputation would be unreliable

**Advantages**:
- No imputation bias
- Simple and transparent
- Preserves observed data integrity

**Disadvantages**:
- Reduces sample size
- May introduce selection bias
- Loses information

---

## Decision Framework

### Step 1: Assess Missing Data Pattern

- **MCAR (Missing Completely At Random)**: Any method works
- **MAR (Missing At Random)**: Use model-based methods (KNN, MICE)
- **MNAR (Missing Not At Random)**: Consider missingness mechanism, possibly drop or flag

### Step 2: Check Missing Percentage

- **<5%**: Dropping rows may be acceptable
- **5-20%**: Simple imputation (mean/median/mode)
- **20-40%**: Advanced methods (KNN, MICE)
- **>40%**: Consider dropping column or creating missing indicator

### Step 3: Consider Variable Type

- **Numeric continuous**: Mean, median, KNN, interpolation
- **Numeric discrete**: Mode, KNN
- **Categorical**: Mode, constant
- **Temporal**: Forward fill, interpolation
- **Text**: Constant value

### Step 4: Evaluate Relationships

- **Independent variables**: Univariate methods (mean, median, mode)
- **Correlated variables**: Multivariate methods (KNN, MICE)

## Best Practices

1. **Analyze before imputing**: Always understand your missing data pattern first
2. **Document decisions**: Keep track of which methods were used and why
3. **Create indicators**: Consider adding binary columns indicating which values were imputed
4. **Validate results**: Check if imputed values are reasonable
5. **Sensitivity analysis**: Test how different imputation methods affect your conclusions
6. **Preserve original data**: Always keep a copy of the original dataset

## Common Pitfalls

1. **Over-imputation**: Imputing too much can create artificial patterns
2. **Wrong method choice**: Using mean for skewed data or mode for continuous data
3. **Ignoring relationships**: Not considering correlations between variables
4. **Imputing non-random missingness**: This can introduce serious bias
5. **Not validating**: Failing to check if imputed values make sense

## References and Further Reading

- Rubin, D. B. (1987). *Multiple Imputation for Nonresponse in Surveys*
- van Buuren, S. (2018). *Flexible Imputation of Missing Data*
- Little, R. J., & Rubin, D. B. (2019). *Statistical Analysis with Missing Data*
