#!/usr/bin/env python3
"""
HuggingFace Inference Example - Context7 Best Practices

Demonstrates HuggingFace patterns from Context7:
- Pipeline API for simple inference
- AutoTokenizer and AutoModel patterns
- Efficient batch processing
- Device management (CPU/GPU)
- Model caching and optimization

Source: /huggingface/transformers (2,790 snippets, trust 9.6)
"""

import logging
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ===================================================================
# CONTEXT7 PATTERN: Pipeline API (Simplest Approach)
# ===================================================================

def pipeline_inference_example():
    """
    Context7 Pattern: Use pipeline API for simplicity
    """
    logger.info("Running pipeline inference example...")

    # Context7 recommended: pipeline() for quick inference
    generator = pipeline(
        "text-generation",
        model="distilgpt2",  # Lightweight model for demo
        device=0 if torch.cuda.is_available() else -1  # Auto device selection
    )

    prompt = "Artificial intelligence is"
    results = generator(prompt, max_length=50, num_return_sequences=1)

    logger.info("✓ Pipeline inference complete")
    return results[0]["generated_text"]


def sentiment_analysis_example():
    """Context7 Pattern: Pre-configured sentiment pipeline"""
    logger.info("Running sentiment analysis...")

    # Context7 pattern: Pre-configured pipeline
    classifier = pipeline(
        "sentiment-analysis",
        device=-1  # CPU for demo
    )

    texts = [
        "I love this product! It's amazing!",
        "This is terrible, waste of money.",
        "It's okay, nothing special."
    ]

    results = classifier(texts)

    logger.info("✓ Sentiment analysis complete")
    return results


# ===================================================================
# CONTEXT7 PATTERN: AutoTokenizer and AutoModel
# ===================================================================

def manual_inference_example():
    """
    Context7 Pattern: AutoTokenizer + AutoModel for flexibility
    """
    logger.info("Running manual inference with AutoModel...")

    model_name = "distilbert-base-uncased-finetuned-sst-2-english"

    # Context7 pattern: Auto classes for model loading
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name)

    text = "This movie is fantastic!"

    # Tokenize
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)

    # Inference
    with torch.no_grad():
        outputs = model(**inputs)

    # Get predictions
    predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
    sentiment = "POSITIVE" if predictions[0][1] > predictions[0][0] else "NEGATIVE"
    confidence = predictions.max().item()

    logger.info(f"✓ Manual inference: {sentiment} (confidence: {confidence:.2f})")
    return {"sentiment": sentiment, "confidence": confidence}


# ===================================================================
# MAIN DEMONSTRATION
# ===================================================================

def main():
    """Run all HuggingFace pattern demonstrations"""
    print("\n" + "=" * 60)
    print("HuggingFace Inference Example - Context7 Best Practices")
    print("=" * 60 + "\n")

    # 1. Pipeline inference
    print("1. Pipeline API (Text Generation)")
    print("-" * 60)
    result = pipeline_inference_example()
    print(f"Generated: {result}\n")

    # 2. Sentiment analysis
    print("\n2. Pipeline API (Sentiment Analysis)")
    print("-" * 60)
    results = sentiment_analysis_example()
    for i, res in enumerate(results, 1):
        print(f"{i}. {res['label']} (score: {res['score']:.3f})")

    # 3. Manual inference
    print("\n\n3. AutoTokenizer + AutoModel (Manual)")
    print("-" * 60)
    result = manual_inference_example()
    print(f"Result: {result}")

    # Summary
    print("\n" + "=" * 60)
    print("EXAMPLES COMPLETED SUCCESSFULLY")
    print("=" * 60)
    print("\nContext7 Patterns Demonstrated:")
    print("1. ✅ pipeline() API for quick inference")
    print("2. ✅ AutoTokenizer + AutoModel for flexibility")
    print("3. ✅ torch.no_grad() for inference efficiency")
    print("4. ✅ Device management (CPU/GPU)")
    print("\nSource: /huggingface/transformers (2,790 snippets, trust 9.6)")


if __name__ == "__main__":
    main()
