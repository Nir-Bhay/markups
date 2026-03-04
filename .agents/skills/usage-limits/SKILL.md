---
name: usage-limits
description: Проверка лимитов затрат для Telegram пользователей
priority: 1000
trigger: on_message
requires:
  env:
    - AGENT_SERVICE_URL
---

# Usage Limits Skill

**КРИТИЧЕСКИ ВАЖНО**: Этот skill ДОЛЖЕН выполняться ПЕРВЫМ при получении любого сообщения из Telegram!

## Когда использовать

Автоматически срабатывает при каждом входящем Telegram сообщении ДО начала обработки.

## Алгоритм

1. **Извлечь Telegram Chat ID** из контекста сообщения
2. **Проверить лимит** через HTTP запрос к agent-brain
3. **Если лимит превышен** - отправить сообщение пользователю и прервать обработку
4. **Если лимит в порядке** - продолжить обработку сообщения

## Проверка лимита

**Endpoint:** `GET http://agent-brain:7080/api/limits/check`

**Headers:**
- `X-Telegram-Id: <TELEGRAM_CHAT_ID>`

**Пример запроса:**

```bash
curl -s -X GET http://agent-brain:7080/api/limits/check \
  -H "X-Telegram-Id: 313145981"
```

**Успешный ответ (лимит в порядке):**
```json
{
  "allowed": true,
  "remaining": 0.73,
  "limit": 1.00,
  "spent": 0.27,
  "nearLimit": false
}
```

**Ответ при превышении лимита:**
```json
{
  "allowed": false,
  "remaining": 0,
  "limit": 1.00,
  "spent": 1.05
}
```

## Обработка результата

### ✅ Лимит в порядке (allowed: true)

Продолжить обработку сообщения как обычно.

**Если nearLimit: true** (использовано >=80%), показать предупреждение:

```
⚠️ Внимание: Использовано 85% дневного лимита AI.

Осталось: 15%
```

### ❌ Лимит превышен (allowed: false)

**НЕМЕДЛЕННО** отправить пользователю сообщение и **ПРЕРВАТЬ** обработку:

```
⚠️ Превышен дневной лимит использования AI

Использовано: 105% дневного лимита

Попробуйте завтра или обратитесь в поддержку для увеличения лимита.
```

**НЕ продолжать обработку запроса!**

## Извлечение Telegram Chat ID

Telegram Chat ID доступен в метаданных сообщения:
- Формат: `[Telegram Анатолий Степанов (@username) id:313145981 ...]`
- Или через префикс сообщения: `[Telegram Chat ID: 313145981]`

Извлечь числовой ID из этих метаданных.

## Обработка ошибок

Если запрос к agent-brain не удался (timeout, 500, network error):

1. **Логировать ошибку**
2. **Разрешить запрос** (fail-open стратегия)
3. **НЕ блокировать пользователя** при сбое системы лимитов

```bash
# Пример с обработкой ошибок
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET http://agent-brain:7080/api/limits/check \
  -H "X-Telegram-Id: 313145981" \
  --connect-timeout 5 \
  --max-time 10)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" != "200" ]; then
  echo "⚠️ Не удалось проверить лимит (код: $HTTP_CODE). Разрешаю запрос (fail-open)."
  # Продолжить обработку
fi
```

## Запись использования

**ОБЯЗАТЕЛЬНО** после каждого успешного ответа отправить данные об использовании:

**Endpoint:** `POST http://agent-brain:7080/api/limits/track`

**Headers:**
- `Content-Type: application/json`
- `X-Telegram-Id: <TELEGRAM_CHAT_ID>`

**Body:**
```json
{
  "model": "gpt-5.2",
  "usage": {
    "prompt_tokens": 1234,
    "completion_tokens": 567
  }
}
```

**Пример запроса:**

```bash
curl -s -X POST http://agent-brain:7080/api/limits/track \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Id: 313145981" \
  -d '{
    "model": "gpt-5.2",
    "usage": {
      "prompt_tokens": 1234,
      "completion_tokens": 567
    }
  }'
```

**Ответ:**
```json
{
  "success": true,
  "cost_usd": 0.010098,
  "total_spent_today": 0.273456
}
```

### Откуда взять данные usage?

После завершения запроса к AI модели, в ответе будут доступны:
- `prompt_tokens` - количество токенов в промпте
- `completion_tokens` - количество токенов в ответе
- `model` - использованная модель (gpt-5.2, claude-sonnet-4-20250514, gpt-4o)

Эти данные **ДОЛЖНЫ** быть отправлены в agent-brain для отслеживания затрат.

## Примеры использования

### Пример 1: Нормальный запрос

```
User: Покажи статистику кампаний
↓
[Skill: usage-limits]
  → curl GET /api/limits/check -H "X-Telegram-Id: 313145981"
  ← {"allowed": true, "remaining": 0.85, ...}
  → Лимит ОК, продолжаю
↓
[Обработка запроса через getCampaigns]
```

### Пример 2: Близко к лимиту

```
User: Создай новую кампанию
↓
[Skill: usage-limits]
  → curl GET /api/limits/check
  ← {"allowed": true, "remaining": 0.12, "nearLimit": true, ...}
  → Отправляю предупреждение
  ⚠️ Внимание: Вы использовали 88% дневного лимита...
↓
[Продолжаю обработку запроса]
```

### Пример 3: Лимит превышен

```
User: Покажи отчёт
↓
[Skill: usage-limits]
  → curl GET /api/limits/check
  ← {"allowed": false, "spent": 1.05, ...}
  → ❌ ПРЕРЫВАЮ обработку

⚠️ Превышен дневной лимит затрат...

[НЕ продолжаю обработку]
```

## Технические детали

- **Приоритет:** 1000 (выполняется первым)
- **Trigger:** on_message (каждое сообщение)
- **Timeout:** 5 секунд на проверку
- **Fallback:** fail-open при ошибке
- **Логирование:** Все проверки логируются в agent-brain

---

**⚠️ ВАЖНО:** Без этого skill пользователи Telegram могут генерировать неограниченные затраты на AI API!
