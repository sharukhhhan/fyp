FROM python:3.10-slim

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Установка рабочей директории
WORKDIR /app

# Копирование и установка зависимостей
COPY notary_system/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копирование исходного кода
COPY notary_system/ .


# Команда запуска
CMD ["sh", "-c", "python manage.py migrate && python manage.py collectstatic --no-input && python manage.py runserver 0.0.0:8000"]