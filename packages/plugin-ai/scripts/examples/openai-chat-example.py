#!/usr/bin/env python3
"""
OpenAI Chat Example - Context7 Best Practices

Demonstrates OpenAI chat patterns from Context7:
- AsyncOpenAI client for non-blocking operations
- Streaming responses with async for
- Function calling and tool usage
- Error handling with exponential backoff
- Response caching for efficiency

Source: /openai/openai-python (277 snippets, trust 9.1)
"""

import asyncio
import os
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from datetime import datetime
import logging
import json
from cachetools import TTLCache

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ===================================================================
# CONTEXT7 PATTERN: AsyncOpenAI Client Configuration
# ===================================================================

class OpenAIConfig:
    """OpenAI client configuration with Context7 best practices"""
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")

        # Context7 recommended configuration
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            max_retries=3,      # Retry failed requests
            timeout=60.0        # Reasonable timeout
        )

        # TTL cache for responses (5 minutes)
        self.cache = TTLCache(maxsize=100, ttl=300)


# ===================================================================
# CONTEXT7 PATTERN: Chat Completions with Streaming
# ===================================================================

async def basic_chat_completion(client: AsyncOpenAI) -> str:
    """
    Basic chat completion with Context7 best practices.

    Context7 Pattern: AsyncOpenAI with proper message formatting
    """
    logger.info("Running basic chat completion...")

    messages = [
        {"role": "system", "content": "You are a helpful AI assistant."},
        {"role": "user", "content": "Explain what makes Python a good programming language in 3 bullet points."}
    ]

    response = await client.chat.completions.create(
        model="gpt-4",
        messages=messages,
        temperature=0.7,
        max_tokens=200
    )

    result = response.choices[0].message.content
    logger.info(f"✓ Basic completion: {result[:50]}...")

    return result


async def streaming_chat_completion(client: AsyncOpenAI) -> str:
    """
    Streaming chat completion with Context7 best practices.

    Context7 Pattern: async for with stream=True
    """
    logger.info("Running streaming chat completion...")

    messages = [
        {"role": "system", "content": "You are a creative writing assistant."},
        {"role": "user", "content": "Write a short haiku about artificial intelligence."}
    ]

    # Context7 pattern: Streaming with async for
    full_response = ""

    async with client.chat.completions.stream(
        model="gpt-4",
        messages=messages,
        temperature=0.9
    ) as stream:
        async for event in stream:
            if event.type == "content.delta":
                chunk = event.content
                if chunk:
                    print(chunk, end="", flush=True)
                    full_response += chunk

    print()  # New line after streaming
    logger.info("✓ Streaming complete")

    return full_response


# ===================================================================
# CONTEXT7 PATTERN: Function Calling
# ===================================================================

# Example functions that the model can call
async def get_current_weather(location: str, unit: str = "celsius") -> str:
    """Get current weather for a location"""
    # Simulate API call
    await asyncio.sleep(0.1)
    logger.info(f"Fetching weather for {location}")
    return json.dumps({
        "location": location,
        "temperature": 22,
        "unit": unit,
        "condition": "sunny"
    })


async def search_web(query: str) -> str:
    """Search the web for information"""
    # Simulate search
    await asyncio.sleep(0.2)
    logger.info(f"Searching for: {query}")
    return json.dumps({
        "query": query,
        "results": [
            {"title": "Result 1", "snippet": "Information about " + query},
            {"title": "Result 2", "snippet": "More details on " + query}
        ]
    })


async function_calling_example(client: AsyncOpenAI) -> str:
    """
    Function calling with Context7 best practices.

    Context7 Pattern: Tool usage with proper function definitions
    """
    logger.info("Running function calling example...")

    # Context7 pattern: Define tools/functions
    tools = [
        {
            "type": "function",
            "function": {
                "name": "get_current_weather",
                "description": "Get the current weather in a given location",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "The city and state, e.g. San Francisco, CA"
                        },
                        "unit": {
                            "type": "string",
                            "enum": ["celsius", "fahrenheit"]
                        }
                    },
                    "required": ["location"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "search_web",
                "description": "Search the web for information",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The search query"
                        }
                    },
                    "required": ["query"]
                }
            }
        }
    ]

    messages = [
        {"role": "system", "content": "You are a helpful assistant with access to tools."},
        {"role": "user", "content": "What's the weather like in Tokyo and can you search for information about Japanese cuisine?"}
    ]

    # Initial request
    response = await client.chat.completions.create(
        model="gpt-4",
        messages=messages,
        tools=tools,
        tool_choice="auto"
    )

    response_message = response.choices[0].message
    tool_calls = response_message.tool_calls

    # If model wants to call functions
    if tool_calls:
        logger.info(f"Model requested {len(tool_calls)} function calls")

        # Add assistant's response to messages
        messages.append(response_message)

        # Execute function calls
        for tool_call in tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)

            logger.info(f"Calling function: {function_name} with args: {function_args}")

            # Call the appropriate function
            if function_name == "get_current_weather":
                function_response = await get_current_weather(**function_args)
            elif function_name == "search_web":
                function_response = await search_web(**function_args)
            else:
                function_response = json.dumps({"error": "Unknown function"})

            # Add function response to messages
            messages.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "name": function_name,
                "content": function_response
            })

        # Get final response
        final_response = await client.chat.completions.create(
            model="gpt-4",
            messages=messages
        )

        result = final_response.choices[0].message.content
        logger.info("✓ Function calling complete")
        return result

    return response_message.content


# ===================================================================
# CONTEXT7 PATTERN: Error Handling with Retry
# ===================================================================

async def completion_with_retry(
    client: AsyncOpenAI,
    messages: List[Dict[str, str]],
    max_retries: int = 3
) -> Optional[str]:
    """
    Chat completion with exponential backoff retry.

    Context7 Pattern: Exponential backoff for failed requests
    """
    for attempt in range(max_retries):
        try:
            response = await client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                temperature=0.7
            )

            return response.choices[0].message.content

        except Exception as e:
            if attempt == max_retries - 1:
                logger.error(f"Final attempt failed: {e}")
                return None

            # Exponential backoff
            delay = 2 ** attempt
            logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {delay}s")
            await asyncio.sleep(delay)

    return None


# ===================================================================
# CONTEXT7 PATTERN: Response Caching
# ===================================================================

async def cached_completion(
    client: AsyncOpenAI,
    cache: TTLCache,
    prompt: str
) -> str:
    """
    Cached chat completion for efficiency.

    Context7 Pattern: TTL cache for repeated queries
    """
    # Check cache
    if prompt in cache:
        logger.info("Cache hit!")
        return cache[prompt]

    # Call API
    messages = [{"role": "user", "content": prompt}]

    response = await client.chat.completions.create(
        model="gpt-4",
        messages=messages,
        temperature=0.1  # Low temperature for consistent results
    )

    result = response.choices[0].message.content

    # Store in cache
    cache[prompt] = result
    logger.info("Cached new response")

    return result


# ===================================================================
# MAIN DEMONSTRATION
# ===================================================================

async def main():
    """Run all Context7 pattern demonstrations"""
    print("\n" + "=" * 60)
    print("OpenAI Chat Example - Context7 Best Practices")
    print("=" * 60 + "\n")

    try:
        # Initialize config
        config = OpenAIConfig()
        client = config.client

        # 1. Basic chat completion
        print("\n1. Basic Chat Completion")
        print("-" * 60)
        result = await basic_chat_completion(client)
        print(f"Response: {result}\n")

        # 2. Streaming chat completion
        print("\n2. Streaming Chat Completion")
        print("-" * 60)
        print("Haiku: ", end="")
        haiku = await streaming_chat_completion(client)
        print()

        # 3. Function calling
        print("\n3. Function Calling with Tools")
        print("-" * 60)
        result = await function_calling_example(client)
        print(f"Response: {result}\n")

        # 4. Error handling with retry
        print("\n4. Completion with Retry")
        print("-" * 60)
        messages = [{"role": "user", "content": "What is 2+2?"}]
        result = await completion_with_retry(client, messages)
        print(f"Response: {result}\n")

        # 5. Response caching
        print("\n5. Response Caching")
        print("-" * 60)
        prompt = "What is the capital of France?"

        # First call (cache miss)
        result1 = await cached_completion(client, config.cache, prompt)
        print(f"First call: {result1}")

        # Second call (cache hit)
        result2 = await cached_completion(client, config.cache, prompt)
        print(f"Second call (cached): {result2}\n")

        # Summary
        print("\n" + "=" * 60)
        print("ALL EXAMPLES COMPLETED SUCCESSFULLY")
        print("=" * 60)
        print("\nContext7 Patterns Demonstrated:")
        print("1. ✅ AsyncOpenAI for non-blocking operations")
        print("2. ✅ Streaming with async for")
        print("3. ✅ Function calling with tools")
        print("4. ✅ Exponential backoff retry logic")
        print("5. ✅ TTL caching for efficiency")
        print("\nSource: /openai/openai-python (277 snippets, trust 9.1)")

    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        print(f"\n❌ Error: {e}")
        print("\nPlease set OPENAI_API_KEY environment variable:")
        print("export OPENAI_API_KEY='your-api-key-here'")

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        print(f"\n❌ Unexpected error: {e}")

    finally:
        # Cleanup
        await client.close()
        logger.info("Client closed")


if __name__ == "__main__":
    print("OpenAI Chat Example - Context7 Best Practices")
    print("=" * 60)
    print("")
    print("This example demonstrates Context7-verified patterns for:")
    print("- AsyncOpenAI client configuration")
    print("- Streaming chat completions")
    print("- Function calling and tool usage")
    print("- Error handling with exponential backoff")
    print("- Response caching for efficiency")
    print("")
    print("Source: /openai/openai-python (277 snippets, trust 9.1)")
    print("")

    asyncio.run(main())
