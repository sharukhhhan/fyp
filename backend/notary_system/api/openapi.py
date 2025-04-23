import httpx
from openai import OpenAI
import json
import logging
import re
from django.conf import settings
from datetime import datetime

logger = logging.getLogger(__name__)



class OpenAIDocumentService:
    """Сервис для работы с AI документами через OpenAI"""
    
    LEGAL_SYSTEM_PROMPTS = {
        'ru': "юридическими нормами Кыргызской Республики",
        'kg': "юридическими нормами Кыргызской Республики"
    }
    
    def __init__(self):
        # Initialize OpenAI client with correct configuration
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY,
            http_client=httpx.Client(
                base_url="https://api.openai.com/v1",
                timeout=60.0
            ))
        self.model = "gpt-4-turbo-preview"
        
    def is_document_content(self, text):
        """Определяет, является ли текст готовым документом"""
        # Список признаков, указывающих на то, что это запрос информации, а не документ
        question_indicators = [
            "необходимо знать",
            "мне нужны",
            "необходима информация",
            "укажите",
            "предоставьте",
            "какие данные",
            "нужны следующие данные",
            "пожалуйста, предоставьте",
            "требуется информация",
            "уточните",
        ]
        
        # Проверяем наличие признаков запроса информации
        for indicator in question_indicators:
            if indicator.lower() in text.lower():
                return False
        
        # Проверяем структуру документа (наличие заголовков, разделов и т.д.)
        document_markers = [
            "ДОВЕРЕННОСТЬ",
            "ДОГОВОР",
            "ЗАЯВЛЕНИЕ",
            "РАСПИСКА",
            "СОГЛАСИЕ",
            "Настоящ",  # "Настоящая доверенность", "Настоящий договор"
            "удостоверяю",
            "даю согласие",
            "обязуюсь",
            "___________",  # Поля для подписей
            "___.___.______",  # Дата
        ]
        
        # Проверяем наличие признаков документа
        document_score = 0
        for marker in document_markers:
            if marker in text:
                document_score += 1
        
        # Если есть хотя бы 2 признака документа, считаем это документом
        return document_score >= 2
        
    def create_system_prompt(self, user_data, document_type, language='ru'):
        """Создание системного промпта для AI с учетом языка"""
        legal_system = self.LEGAL_SYSTEM_PROMPTS.get(language, self.LEGAL_SYSTEM_PROMPTS['ru'])
        language_name = "русском" if language == 'ru' else "кыргызском"
        
        return f"""Вы - AI-ассистент нотариальной системы, специализирующийся на создании юридических документов на {language_name} языке.

    ВАЖНО: Когда пользователь запрашивает создание документа, всегда создавайте полный юридический документ с правильной структурой. 
    НЕ ЗАПРАШИВАЙТЕ у пользователя его личные данные, они уже есть в системе и автоматически вставляются в документ при его создании. 
    Данные пользователя уже доступны и указаны ниже.

    Данные пользователя:
    - ФИО
    - Тип документа
    - Номер документа
    - Дата рождения
    - Дата выдачи документа
    - Срок действия документа

    Эти данные УЖЕ ДОСТУПНЫ СИСТЕМЕ и будут автоматически вставлены в документ. Вам НЕ НУЖНО запрашивать эти данные у пользователя! Также в тексте не надо просить в текстом указать эти данные (Вроде [Укажите ФИО]).

    В документы можно запрашивать только:
    1. Данные других лиц (ФИО третьих лиц, их реквизиты)
    2. Специфические детали документа (срок действия доверенности, суммы, описание имущества и т.д.)
    3. Дополнительные пункты и условия

    Требования:
    1. Создавайте документы в соответствии с {legal_system}
    2. Используйте формальный юридический стиль речи на {language_name} языке
    3. Сохраняйте корректную структуру документа
    4. Автоматически вставляйте данные пользователя в соответствующие поля
    5. Если информации недостаточно, запросите только недостающие данные о третьих лицах или условиях
    6. Форматируйте документ для последующего преобразования в PDF
    7. Всегда помните предыдущий контекст и учитывайте все полученные от пользователя данные
    8. Если документ уже полностью готов, без правок, то избегай в ответе следующие фразы:
    "необходимо знать", "мне нужны", "необходима информация", "укажите", "предоставьте", "какие данные", "нужны следующие данные", "пожалуйста, предоставьте", "требуется информация", "уточните",
    """
        
    def generate_document(self, user_data, prompt, document_type=None, language='ru', previous_content=None, conversation_history=None):
        """Генерация документа через OpenAI API с поддержкой истории"""
        try:
            system_prompt = self.create_system_prompt(user_data, document_type, language)
            
            # Формируем историю сообщений
            messages = [{"role": "system", "content": system_prompt}]
            
            # Добавляем предыдущие сообщения из истории, если они есть
            if conversation_history:
                for msg in conversation_history:
                    messages.append({
                        "role": "user" if msg.get('role') == 'user' else "assistant",
                        "content": msg.get('content')
                    })
            
            # Добавляем текущий запрос
            if previous_content:
                user_prompt = f"""Текущий документ:
{previous_content}

Запрос пользователя: {prompt}"""
            else:
                user_prompt = prompt
            
            messages.append({"role": "user", "content": user_prompt})
            
            # Вызов API OpenAI
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.3,
                max_tokens=2000
            )
            
            generated_content = response.choices[0].message.content
            
            # Определяем, является ли ответ документом
            is_document = self.is_document_content(generated_content)
            
            return {
                'success': True,
                'content': generated_content,
                'is_document': is_document,
                'model_used': self.model,
                'language': language,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.exception(f"Error generating document: {str(e)}")
            return {
                'success': False,
                'error': 'Произошла ошибка при обращении к AI сервису',
                'details': str(e)
            }
    
    def translate_document(self, document_content, from_language, to_language):
        """Перевод документа с одного языка на другой"""
        try:
            language_map = {
                'ru': "русского",
                'kg': "кыргызского",
                'en': "английского"
            }
            
            from_lang_name = language_map.get(from_language, "неизвестного")
            to_lang_name = language_map.get(to_language, "неизвестного")
            
            prompt = f"""Переведите следующий юридический документ на {to_lang_name} язык, 
сохраняя юридическую точность и формальный стиль:

{document_content}

Убедитесь, что перевод сохраняет все юридические термины и структуру оригинального документа."""
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            translated_content = response.choices[0].message.content
            
            return {
                'success': True,
                'content': translated_content,
                'from_language': from_language,
                'to_language': to_language,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.exception(f"Error translating document: {str(e)}")
            return {
                'success': False,
                'error': 'Произошла ошибка при переводе документа',
                'details': str(e)
            }
    
    def extract_text_from_pdf(self, pdf_content):
        """
        Извлечение текста из PDF-файла.
        В реальной имплементации следует использовать библиотеки для работы с PDF.
        """
        try:
            from PyPDF2 import PdfReader
            
            reader = PdfReader(pdf_content)
            text = ""
            
            for page in reader.pages:
                text += page.extract_text() + "\n"
            
            return {
                'success': True,
                'content': text
            }
        except Exception as e:
            logger.exception(f"Error extracting text from PDF: {str(e)}")
            return {
                'success': False,
                'error': 'Произошла ошибка при извлечении текста из PDF',
                'details': str(e)
            }
    
    def analyze_document(self, document_content, language='ru'):
        """Анализ документа для выявления возможных ошибок и несоответствий"""
        try:
            legal_system = self.LEGAL_SYSTEM_PROMPTS.get(language, self.LEGAL_SYSTEM_PROMPTS['ru'])
            
            prompt = f"""Проанализируйте следующий юридический документ на соответствие {legal_system} и проверьте его на:
1. Соответствие юридическим нормам
2. Корректность структуры
3. Правильность реквизитов
4. Отсутствие противоречий
5. Полноту информации

Документ:
{document_content}

Предоставьте заключение о качестве документа и рекомендации по улучшению, если необходимо."""
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )
            
            analysis = response.choices[0].message.content
            
            return {
                'success': True,
                'analysis': analysis,
                'language': language,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.exception(f"Error analyzing document: {str(e)}")
            return {
                'success': False,
                'error': 'Произошла ошибка при анализе документа',
                'details': str(e)
            }