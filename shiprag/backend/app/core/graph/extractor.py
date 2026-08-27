"""Static AST extractor using Python standard AST and Tree-sitter for TS/JS.

Never executes or runs repository code. Processes files strictly as text/AST.
"""
import ast
import re
from pathlib import Path
from typing import Dict, List, Any, Optional

try:
    import tree_sitter_python
    import tree_sitter_javascript
    import tree_sitter_typescript
    from tree_sitter import Language, Parser
    TREE_SITTER_AVAILABLE = True
except Exception:
    TREE_SITTER_AVAILABLE = False


def extract_python_ast(file_path: str, code_content: str) -> Dict[str, Any]:
    """Parse Python source files into classes, functions, calls, and imports without code execution."""
    classes = []
    functions = []
    imports = []
    calls = []
    
    try:
        tree = ast.parse(code_content)
    except SyntaxError:
        return {"classes": [], "functions": [], "imports": [], "calls": []}

    for node in ast.walk(tree):
        # 1. Imports
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.append(alias.name)
        elif isinstance(node, ast.ImportFrom):
            mod = node.module or ""
            for alias in node.names:
                imports.append(f"{mod}.{alias.name}" if mod else alias.name)
                
        # 2. Classes
        elif isinstance(node, ast.ClassDef):
            base_names = []
            for base in node.bases:
                if isinstance(base, ast.Name):
                    base_names.append(base.id)
                elif isinstance(base, ast.Attribute):
                    base_names.append(base.attr)
            classes.append({
                "name": node.name,
                "lineStart": node.lineno,
                "lineEnd": getattr(node, "end_lineno", node.lineno),
                "bases": base_names,
            })
            
        # 3. Functions / Methods
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            func_calls = []
            for subnode in ast.walk(node):
                if isinstance(subnode, ast.Call):
                    if isinstance(subnode.func, ast.Name):
                        func_calls.append(subnode.func.id)
                    elif isinstance(subnode.func, ast.Attribute):
                        func_calls.append(subnode.func.attr)
            functions.append({
                "name": node.name,
                "lineStart": node.lineno,
                "lineEnd": getattr(node, "end_lineno", node.lineno),
                "calls": list(set(func_calls)),
            })
            
        # 4. Top-level calls
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                calls.append(node.func.id)
            elif isinstance(node.func, ast.Attribute):
                calls.append(node.func.attr)

    return {
        "classes": classes,
        "functions": functions,
        "imports": list(set(imports)),
        "calls": list(set(calls)),
    }


def extract_js_ts_ast(file_path: str, code_content: str, is_ts: bool = True) -> Dict[str, Any]:
    """Parse TypeScript and JavaScript files for function declarations, class methods, and imports."""
    classes = []
    functions = []
    imports = []
    calls = []

    # 1. Imports
    import_matches = re.findall(r'import\s+(?:\{[^}]*\}|\w+|\*\s+as\s+\w+)\s+from\s+[\'"]([^\'"]+)[\'"]', code_content)
    require_matches = re.findall(r'require\([\'"]([^\'"]+)[\'"]\)', code_content)
    imports.extend(import_matches + require_matches)

    # 2. Classes & Bases
    class_matches = re.finditer(r'class\s+([a-zA-Z0-9_$]+)(?:\s+extends\s+([a-zA-Z0-9_$]+))?', code_content)
    for m in class_matches:
        classes.append({
            "name": m.group(1),
            "lineStart": code_content[:m.start()].count("\n") + 1,
            "lineEnd": code_content[:m.end()].count("\n") + 1,
            "bases": [m.group(2)] if m.group(2) else [],
        })

    # 3. Standard Functions: function foo(...) or export function foo(...)
    func_matches = re.finditer(r'(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(', code_content)
    for m in func_matches:
        functions.append({
            "name": m.group(1),
            "lineStart": code_content[:m.start()].count("\n") + 1,
            "lineEnd": code_content[:m.end()].count("\n") + 1,
            "calls": [],
        })

    # 4. Arrow Functions / Expressions: const foo = (...) => or const foo = async (...) =>
    arrow_matches = re.finditer(r'(?:export\s+)?const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>', code_content)
    for m in arrow_matches:
        functions.append({
            "name": m.group(1),
            "lineStart": code_content[:m.start()].count("\n") + 1,
            "lineEnd": code_content[:m.end()].count("\n") + 1,
            "calls": [],
        })

    # 5. Class Methods: async processCharge(...) or methodName(...) {
    method_matches = re.finditer(r'(?:async\s+)?([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{', code_content)
    for m in method_matches:
        name = m.group(1)
        if name not in ("if", "for", "while", "switch", "catch", "function"):
            if not any(f["name"] == name for f in functions):
                functions.append({
                    "name": name,
                    "lineStart": code_content[:m.start()].count("\n") + 1,
                    "lineEnd": code_content[:m.end()].count("\n") + 1,
                    "calls": [],
                })

    return {
        "classes": classes,
        "functions": functions,
        "imports": list(set(imports)),
        "calls": list(set(calls)),
    }



def extract_source_ast(file_path: str, code_content: str) -> Dict[str, Any]:
    """Dispatch static extraction based on file extension safely without executing untrusted code."""
    p = Path(file_path)
    ext = p.suffix.lower()

    if ext == ".py":
        return extract_python_ast(file_path, code_content)
    elif ext in (".ts", ".tsx"):
        return extract_js_ts_ast(file_path, code_content, is_ts=True)
    elif ext in (".js", ".jsx"):
        return extract_js_ts_ast(file_path, code_content, is_ts=False)
    
    return {"classes": [], "functions": [], "imports": [], "calls": []}
