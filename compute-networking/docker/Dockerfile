FROM python:3.10-alpine

# Prepare work directory.
RUN mkdir /portfolio_report
WORKDIR /portfolio_report

# Install dependencies
COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Add entrypoint script.
COPY append_to_hosts_and_run.sh .
# Add our python script.
COPY report_generator.py .

# The prescribed way to use this image is to invoke report_generator.py with arbitrary parameters.
ENTRYPOINT ["./append_to_hosts_and_run.sh", "104.17.137.178 pro-api.coinmarketcap.com", "python", "report_generator.py"]
