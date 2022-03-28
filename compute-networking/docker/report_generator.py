#!/usr/bin/env python
 
import json
import os
import sys
import requests

CFG_CMC_API_KEY = "CMC_API_KEY"

# Read command-line parameters.
input_path = sys.argv[1]
output_path = sys.argv[2]

with open(input_path, "r") as f:
    portfolio = json.load(f)

# Defaults to oasis-provided api key
api_key = os.getenv(CFG_CMC_API_KEY, "f4017404-0b14-4fa9-9599-881bbb721547")

url_params = {
  "symbol": ",".join(portfolio.keys()),
}

url_headers = {
  # Headers required by Cloudfront
  "Host": "pro-api.coinmarketcap.com",
  "Accept": "application/json",

  # Coinmarketcap required API Key
  "X-CMC_PRO_API_KEY": api_key,
}

prices = requests.get("https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest", \
	params=url_params, headers=url_headers).json()

portfolio_value = sum([portfolio[ticker] * prices["data"][ticker]["quote"]["USD"]["price"] \
    for ticker in portfolio])

with open(output_path, "w") as f:
    f.write(f"The current value of your portfolio is ${portfolio_value}.\n")
