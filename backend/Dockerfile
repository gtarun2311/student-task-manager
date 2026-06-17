# Use official Python image.
# slim means smaller image size.
FROM python:3.11-slim

# Set working folder inside the Docker container.
WORKDIR /app

# Copy requirements first.
# Docker can reuse this step if requirements do not change.
COPY requirements.txt .

# Install Python packages inside the container.
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend files into the container.
COPY . .

# Tell Docker that backend uses port 8000.
EXPOSE 8000

# Start FastAPI backend.
# 0.0.0.0 is important because the app runs inside Docker.
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]