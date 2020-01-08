import os
import json
import pandas as pd

output = {}

for csv_file in os.listdir('distributions'):
    season = int(csv_file.split('.')[0])
    csv_file = os.path.join('distributions', csv_file)

    df = pd.read_csv(csv_file, header=0)
    df = df.drop('Rank Tier', axis=1)

    output[season] = df.to_dict(orient='list')

with open('src/assets/distributions.json', 'w') as f:
    json.dump(output, f, separators=(',', ':'))
