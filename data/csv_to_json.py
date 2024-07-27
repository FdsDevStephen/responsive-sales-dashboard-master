import pandas as pd

# Load the CSV file
csv_file = r'C:\Users\Ancita\Downloads\cleaned_ENROLLMENT_NPTEL1.csv'  # Using raw string literal

# Read the CSV file
df = pd.read_csv(csv_file)

# Convert the DataFrame to JSON
json_data = df.to_json(orient='records')

# Save the JSON to a file
with open('dataset.json', 'w') as json_file:
    json_file.write(json_data)

print("CSV file has been converted to dataset.json")
