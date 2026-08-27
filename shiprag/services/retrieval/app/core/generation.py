"""LLM generation orchestration and prompt formatting."""
from anthropic import Anthropic
from typing import AsyncGenerator

from app.core.config import settings

_anthropic = Anthropic(api_key=settings.anthropic_api_key)


def build_prompt(question: str, chunks: list[dict]) -> str:
    context_blocks = []
    for idx, c in enumerate(chunks, 1):
        context_blocks.append(f"[{idx}] Source: {c['source']}\n{c['content']}")

    context = "\n\n---\n\n".join(context_blocks)
    return (
        "Answer the question accurately using ONLY the context provided below. "
        "Include source citations using [1], [2], etc., matching the numbered sources.\n"
        "If the context does not contain enough information to answer, state that clearly.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {question}"
    )


def generate_answer(question: str, chunks: list[dict]) -> str:
    prompt = build_prompt(question, chunks)
    message = _anthropic.messages.create(
        model=settings.generation_model,
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}],
    )
    return "".join(block.text for block in message.content if block.type == "text")


async def generate_answer_stream(question: str, chunks: list[dict]) -> AsyncGenerator[str, None]:
    prompt = build_prompt(question, chunks)
    with _anthropic.messages.stream(
        model=settings.generation_model,
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            yield text
