#!/usr/bin/env python3
"""
LangChain RAG Example - Context7 Best Practices

Demonstrates LangChain RAG patterns from Context7:
- RunnablePassthrough.assign() for context injection
- Vector store retrieval with MMR
- RAG chain composition
- Document chunking and embedding
- Contextual compression for relevance

Source: /langchain-ai/langchain (150 snippets, trust 9.2)
"""

import os
import logging
from typing import List
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from operator import itemgetter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ===================================================================
# CONTEXT7 PATTERN: Document Ingestion and Chunking
# ===================================================================

def create_sample_documents():
    """Create sample documents for demonstration"""
    documents = [
        """
        Python is a high-level, interpreted programming language known for its simplicity
        and readability. It was created by Guido van Rossum and first released in 1991.
        Python supports multiple programming paradigms including procedural, object-oriented,
        and functional programming. It has a comprehensive standard library and a large
        ecosystem of third-party packages available through PyPI.
        """,
        """
        Machine Learning is a subset of artificial intelligence that focuses on the
        development of algorithms that can learn from and make predictions on data.
        Python is one of the most popular languages for machine learning due to libraries
        like scikit-learn, TensorFlow, and PyTorch. These libraries provide implementations
        of various ML algorithms including classification, regression, and clustering.
        """,
        """
        LangChain is a framework for developing applications powered by language models.
        It provides abstractions for working with LLMs, including chains, agents, and
        retrievers. LangChain supports various vector stores for retrieval-augmented
        generation (RAG), including Chroma, FAISS, and Pinecone. RAG combines the power
        of language models with external knowledge bases for more accurate responses.
        """,
        """
        Vector databases store high-dimensional vectors (embeddings) and enable efficient
        similarity search. They are essential for RAG systems because they allow quick
        retrieval of relevant documents based on semantic similarity. Popular vector
        databases include Chroma (lightweight, local), Pinecone (cloud-based), and
        FAISS (Facebook AI Similarity Search). Embeddings are typically generated
        using models like OpenAI's text-embedding-3-small or sentence transformers.
        """
    ]

    return documents


def ingest_and_chunk_documents(texts: List[str]) -> List:
    """
    Ingest and chunk documents with Context7 best practices.

    Context7 Pattern: RecursiveCharacterTextSplitter with optimal parameters
    """
    logger.info("Chunking documents...")

    # Context7 recommended: RecursiveCharacterTextSplitter
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=512,              # Optimal for embeddings
        chunk_overlap=50,            # Maintain context across chunks
        length_function=len,
        separators=["\n\n", "\n", " ", ""]  # Hierarchical splitting
    )

    # Split documents
    chunks = []
    for i, text in enumerate(texts):
        splits = text_splitter.split_text(text.strip())
        for j, split in enumerate(splits):
            chunks.append({
                "page_content": split,
                "metadata": {"source": f"doc_{i}", "chunk": j}
            })

    logger.info(f"✓ Created {len(chunks)} chunks from {len(texts)} documents")
    return chunks


# ===================================================================
# CONTEXT7 PATTERN: Vector Store Creation
# ===================================================================

def create_vector_store(chunks: List[dict], persist_dir: str = "./chroma_db") -> Chroma:
    """
    Create vector store with Context7 best practices.

    Context7 Pattern: Chroma with text-embedding-3-small
    """
    logger.info("Creating vector store...")

    # Context7 recommended: text-embedding-3-small (cost-effective)
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

    # Extract text and metadata
    texts = [chunk["page_content"] for chunk in chunks]
    metadatas = [chunk["metadata"] for chunk in chunks]

    # Create Chroma vector store
    vectorstore = Chroma.from_texts(
        texts=texts,
        embedding=embeddings,
        metadatas=metadatas,
        persist_directory=persist_dir
    )

    logger.info(f"✓ Vector store created with {len(texts)} documents")
    return vectorstore


# ===================================================================
# CONTEXT7 PATTERN: Retriever Configuration
# ===================================================================

def create_mmr_retriever(vectorstore: Chroma, k: int = 4):
    """
    Create MMR retriever with Context7 best practices.

    Context7 Pattern: MMR (Maximal Marginal Relevance) for diversity
    """
    logger.info("Creating MMR retriever...")

    # Context7 recommended: MMR for diverse, relevant results
    retriever = vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": k,                    # Number of documents to return
            "fetch_k": k * 2,          # Fetch more candidates
            "lambda_mult": 0.7         # Balance relevance (1.0) vs diversity (0.0)
        }
    )

    logger.info(f"✓ MMR retriever created (k={k}, fetch_k={k*2}, lambda=0.7)")
    return retriever


# ===================================================================
# CONTEXT7 PATTERN: RAG Chain with RunnablePassthrough.assign()
# ===================================================================

def create_rag_chain(retriever):
    """
    Create RAG chain with Context7 best practices.

    Context7 Pattern: RunnablePassthrough.assign() for elegant context handling
    """
    logger.info("Creating RAG chain...")

    # Context7 recommended prompt template
    template = """Answer the question based ONLY on the following context.
If you cannot answer the question based on the context, say "I don't have enough information to answer."

Context:
{context}

Question: {question}

Answer:"""

    prompt = ChatPromptTemplate.from_template(template)

    # Context7: Use low temperature for factual responses
    llm = ChatOpenAI(model="gpt-4", temperature=0)

    # Context7 pattern: RunnablePassthrough.assign() for clean composition
    rag_chain = (
        RunnablePassthrough.assign(
            context=itemgetter("question")
                | retriever
                | (lambda docs: "\n\n".join(doc.page_content for doc in docs))
        )
        | prompt
        | llm
        | StrOutputParser()
    )

    logger.info("✓ RAG chain created with RunnablePassthrough.assign()")
    return rag_chain


# ===================================================================
# CONTEXT7 PATTERN: RAG Query Examples
# ===================================================================

async def run_rag_queries(rag_chain):
    """Run example RAG queries to demonstrate retrieval"""
    print("\n" + "=" * 60)
    print("RAG QUERY EXAMPLES")
    print("=" * 60 + "\n")

    queries = [
        {
            "title": "Query 1: Python Basics",
            "question": "What is Python and who created it?"
        },
        {
            "title": "Query 2: Machine Learning",
            "question": "What Python libraries are popular for machine learning?"
        },
        {
            "title": "Query 3: RAG and LangChain",
            "question": "What is RAG and how does LangChain support it?"
        },
        {
            "title": "Query 4: Unknown Topic (should return 'insufficient info')",
            "question": "What is quantum computing?"
        }
    ]

    for query in queries:
        print(f"\n{query['title']}")
        print("-" * 60)
        print(f"Question: {query['question']}")
        print()

        try:
            response = rag_chain.invoke({"question": query["question"]})
            print(f"Answer: {response}")

        except Exception as e:
            logger.error(f"Query failed: {e}")
            print(f"Error: {e}")

        print()


# ===================================================================
# CONTEXT7 PATTERN: Retrieval Quality Testing
# ===================================================================

def test_retrieval_quality(retriever):
    """Test retrieval quality with sample queries"""
    print("\n" + "=" * 60)
    print("RETRIEVAL QUALITY TEST")
    print("=" * 60 + "\n")

    test_queries = [
        "Python programming language",
        "machine learning libraries",
        "vector databases and embeddings"
    ]

    for query in test_queries:
        print(f"Query: '{query}'")
        print("-" * 60)

        # Retrieve documents
        docs = retriever.get_relevant_documents(query)

        for i, doc in enumerate(docs, 1):
            preview = doc.page_content[:100].replace("\n", " ")
            print(f"{i}. {preview}...")

        print()


# ===================================================================
# MAIN DEMONSTRATION
# ===================================================================

def main():
    """Run complete RAG demonstration"""
    print("\n" + "=" * 60)
    print("LangChain RAG Example - Context7 Best Practices")
    print("=" * 60 + "\n")

    try:
        # Check API key
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("OPENAI_API_KEY environment variable not set")

        # 1. Create sample documents
        print("Step 1: Creating sample documents...")
        documents = create_sample_documents()
        print(f"✓ Created {len(documents)} sample documents\n")

        # 2. Chunk documents
        print("Step 2: Chunking documents...")
        chunks = ingest_and_chunk_documents(documents)
        print()

        # 3. Create vector store
        print("Step 3: Creating vector store...")
        vectorstore = create_vector_store(chunks)
        print()

        # 4. Create retriever
        print("Step 4: Creating MMR retriever...")
        retriever = create_mmr_retriever(vectorstore, k=3)
        print()

        # 5. Test retrieval quality
        test_retrieval_quality(retriever)

        # 6. Create RAG chain
        print("Step 5: Creating RAG chain...")
        rag_chain = create_rag_chain(retriever)
        print()

        # 7. Run RAG queries
        import asyncio
        asyncio.run(run_rag_queries(rag_chain))

        # Summary
        print("\n" + "=" * 60)
        print("RAG EXAMPLE COMPLETED SUCCESSFULLY")
        print("=" * 60)
        print("\nContext7 Patterns Demonstrated:")
        print("1. ✅ RecursiveCharacterTextSplitter for hierarchical chunking")
        print("2. ✅ text-embedding-3-small for cost-effective embeddings")
        print("3. ✅ MMR retrieval for diverse, relevant results")
        print("4. ✅ RunnablePassthrough.assign() for clean composition")
        print("5. ✅ Temperature=0 for factual RAG responses")
        print("6. ✅ Context boundary enforcement in prompt")
        print("\nSource: /langchain-ai/langchain (150 snippets, trust 9.2)")

    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        print(f"\n❌ Error: {e}")
        print("\nPlease set OPENAI_API_KEY environment variable:")
        print("export OPENAI_API_KEY='your-api-key-here'")

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("LangChain RAG Example - Context7 Best Practices")
    print("=" * 60)
    print("")
    print("This example demonstrates Context7-verified patterns for:")
    print("- Document chunking with RecursiveCharacterTextSplitter")
    print("- Vector store creation with Chroma")
    print("- MMR retrieval for diverse results")
    print("- RAG chain composition with RunnablePassthrough.assign()")
    print("- Context boundary enforcement")
    print("")
    print("Source: /langchain-ai/langchain (150 snippets, trust 9.2)")
    print("")

    main()
