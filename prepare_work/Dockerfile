FROM python:3.9-slim

WORKDIR /app
COPY neo4j_api.py .
RUN pip install flask py2neo flask_cors

EXPOSE 5000
CMD ["python", "neo4j_api.py"]