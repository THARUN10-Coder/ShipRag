"""Graph builder: constructs nodes and edges from AST extractions and persists them to disk."""
import json
from pathlib import Path
from typing import Dict, List, Any, Optional

from app.core.graph.extractor import extract_source_ast
from app.core.graph.models import GraphNode, GraphEdge, RepositoryGraphResponse

# Persistent disk storage for AST graphs
_GRAPH_STORAGE_FILES = [
    Path(__file__).resolve().parent.parent.parent / "repository_ast_graphs.json",
    Path("repository_ast_graphs.json"),
]


def _load_graph_store() -> Dict[str, Dict[str, Any]]:
    for p in _GRAPH_STORAGE_FILES:
        if p.exists():
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
                if data:
                    return data
            except Exception:
                continue
    return {}


def _save_graph_store(data: Dict[str, Dict[str, Any]]) -> None:
    try:
        _GRAPH_STORAGE_FILES[0].write_text(json.dumps(data, indent=2), encoding="utf-8")
    except Exception as e:
        print(f"[GraphStore Save Error]: {e}")


def build_repository_graph(project_id: str, files_data: List[Dict[str, str]]) -> RepositoryGraphResponse:
    """Constructs GraphNode[] and GraphEdge[] from a list of files {'path': '...', 'content': '...'}."""
    nodes: List[GraphNode] = []
    edges: List[GraphEdge] = []
    
    # 1. Top-Level Repository Root Node
    repo_node_id = f"repo:{project_id}"
    nodes.append(GraphNode(
        id=repo_node_id,
        type="repository",
        name=project_id,
        repositoryId=project_id,
        description=f"Source code repository root for {project_id}",
    ))

    file_node_map: Dict[str, str] = {}
    func_node_map: Dict[str, str] = {}

    scanned_count = len(files_data)
    parsed_count = 0
    skipped_count = 0

    # 2. Extract File Nodes and Symbols
    for f in files_data:
        file_path = f.get("path", "")
        content = f.get("content", "")
        if not file_path:
            continue

        ext = Path(file_path).suffix.lower()
        if ext not in (".py", ".ts", ".tsx", ".js", ".jsx"):
            skipped_count += 1
            continue

        parsed_count += 1
        ast_data = extract_source_ast(file_path, content)

        file_node_id = f"file:{project_id}:{file_path}"
        file_node_map[file_path] = file_node_id

        func_names = [fn["name"] for fn in ast_data.get("functions", [])]
        class_names = [cl["name"] for cl in ast_data.get("classes", [])]

        # File Node
        nodes.append(GraphNode(
            id=file_node_id,
            type="file",
            name=Path(file_path).name,
            filePath=file_path,
            repositoryId=project_id,
            language="Python" if ext == ".py" else "TypeScript" if ext in (".ts", ".tsx") else "JavaScript",
            functions=func_names,
            imports=ast_data.get("imports", []),
            description=f"Source file {file_path} containing {len(func_names)} functions and {len(class_names)} classes.",
        ))

        # Edge: Repository CONTAINS File
        edges.append(GraphEdge(
            id=f"edge:{repo_node_id}:{file_node_id}",
            source=repo_node_id,
            target=file_node_id,
            type="CONTAINS",
            repositoryId=project_id,
            label="contains",
        ))

        # Function Nodes
        for fn in ast_data.get("functions", []):
            func_node_id = f"func:{project_id}:{file_path}:{fn['name']}"
            func_node_map[fn['name']] = func_node_id
            nodes.append(GraphNode(
                id=func_node_id,
                type="function",
                name=f"{fn['name']}()",
                filePath=file_path,
                repositoryId=project_id,
                lineStart=fn.get("lineStart"),
                lineEnd=fn.get("lineEnd"),
                dependencies=fn.get("calls", []),
                description=f"Function {fn['name']} defined in {file_path}:{fn.get('lineStart', 1)}",
            ))

            # Edge: File CONTAINS Function
            edges.append(GraphEdge(
                id=f"edge:{file_node_id}:{func_node_id}",
                source=file_node_id,
                target=func_node_id,
                type="CONTAINS",
                repositoryId=project_id,
                label="defines",
            ))

        # Class Nodes
        for cl in ast_data.get("classes", []):
            class_node_id = f"class:{project_id}:{file_path}:{cl['name']}"
            nodes.append(GraphNode(
                id=class_node_id,
                type="class",
                name=cl["name"],
                filePath=file_path,
                repositoryId=project_id,
                lineStart=cl.get("lineStart"),
                lineEnd=cl.get("lineEnd"),
                dependencies=cl.get("bases", []),
                description=f"Class {cl['name']} in {file_path}:{cl.get('lineStart', 1)}",
            ))

            # Edge: File CONTAINS Class
            edges.append(GraphEdge(
                id=f"edge:{file_node_id}:{class_node_id}",
                source=file_node_id,
                target=class_node_id,
                type="CONTAINS",
                repositoryId=project_id,
                label="declares",
            ))

    # 3. Inter-File Import & Call Relationships
    for n in nodes:
        if n.type == "file" and n.filePath:
            for imp in n.imports:
                for other_path, other_id in file_node_map.items():
                    # Check if imported module matches another file in the repository
                    base_name = Path(other_path).stem
                    if base_name in imp or imp.endswith(base_name):
                        if n.id != other_id:
                            n.dependencies.append(Path(other_path).name)
                            edges.append(GraphEdge(
                                id=f"edge:imp:{n.id}:{other_id}",
                                source=n.id,
                                target=other_id,
                                type="IMPORTS",
                                repositoryId=project_id,
                                label="imports",
                            ))

    # 4. Save to Persistent Store
    store = _load_graph_store()
    response_data = {
        "repository_id": project_id,
        "nodes": [n.model_dump() for n in nodes],
        "edges": [e.model_dump() for e in edges],
        "stats": {
            "files_scanned": scanned_count,
            "files_parsed": parsed_count,
            "files_skipped": skipped_count,
            "total_nodes": len(nodes),
            "total_edges": len(edges),
        }
    }
    store[project_id] = response_data
    _save_graph_store(store)

    return RepositoryGraphResponse(
        repository_id=project_id,
        nodes=nodes,
        edges=edges,
        stats=response_data["stats"],
    )


def get_cached_graph(project_id: str) -> Optional[RepositoryGraphResponse]:
    """Retrieve persisted AST graph for a project."""
    store = _load_graph_store()
    if project_id in store:
        data = store[project_id]
        return RepositoryGraphResponse(**data)
    
    # Case-insensitive match
    for pid, data in store.items():
        if pid.lower() == project_id.lower() or pid in project_id or project_id in pid:
            return RepositoryGraphResponse(**data)
            
    return None
