"""Data models for AST Code Graph representation."""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class GraphNode(BaseModel):
    id: str
    type: str  # "repository" | "file" | "class" | "function" | "module"
    name: str
    filePath: Optional[str] = None
    repositoryId: str
    language: Optional[str] = None
    lineStart: Optional[int] = None
    lineEnd: Optional[int] = None
    functions: List[str] = Field(default_factory=list)
    imports: List[str] = Field(default_factory=list)
    dependencies: List[str] = Field(default_factory=list)
    dependents: List[str] = Field(default_factory=list)
    description: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str  # "CONTAINS" | "IMPORTS" | "CALLS" | "EXTENDS" | "DEPENDS_ON"
    repositoryId: str
    label: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class RepositoryGraphResponse(BaseModel):
    repository_id: str
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    stats: Dict[str, Any]
