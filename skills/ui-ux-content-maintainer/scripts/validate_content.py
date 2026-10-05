"""Read-only UI/UX content checks. Python standard library; no network or API calls."""

import argparse
import json
import math
import re
import string
from pathlib import Path
from urllib.parse import urlparse

LOCALES = ("zh-CN", "en", "ja", "ko", "de")
SLUG = re.compile(r"[a-z][a-z0-9]*(?:-[a-z0-9]+)*\Z")
PARAM = re.compile(r"[a-z][a-z0-9_]*\Z")


def text(value):
    return isinstance(value, str) and bool(value.strip())


def strings(value):
    return isinstance(value, list) and all(text(part) for part in value)


def number(value):
    if type(value) not in (int, float):
        return False
    try:
        return math.isfinite(value)
    except OverflowError:
        return False


def parameter_error(spec, value):
    if not isinstance(spec, dict):
        return "parameter definition must be an object"
    if spec.get("type") == "number":
        low, high = spec.get("min"), spec.get("max")
        if not number(low) or not number(high) or low > high:
            return "invalid numeric range"
        if not number(value) or not low <= value <= high:
            return "value must be a finite number within the registered range"
    elif spec.get("type") == "enum":
        choices = spec.get("values")
        if not strings(choices) or not choices or len(set(choices)) != len(choices):
            return "enum choices must be unique nonempty strings"
        if not isinstance(value, str) or value not in choices:
            return "value must be one of the registered enum choices"
    elif spec.get("type") == "color":
        if not isinstance(value, str) or re.fullmatch(r"#[0-9a-fA-F]{6}", value) is None:
            return "color must be a six-digit hexadecimal value such as #B5452E"
    else:
        return "unsupported parameter type"
    return None


def inspect_pack(root, publish=False, required_locales=("zh-CN", "en")):
    root = Path(root).resolve()
    errors, warnings = [], []
    items = {}
    count = 0

    def error(label, message):
        errors.append(f"{label}: {message}")

    def read(path):
        label = path.relative_to(root).as_posix()
        try:
            def invalid_constant(value):
                raise ValueError("non-finite JSON constant")
            def unique_keys(pairs):
                result = {}
                for key, value in pairs:
                    if key in result:
                        raise ValueError("duplicate JSON object key")
                    result[key] = value
                return result
            value = json.loads(path.read_text(encoding="utf-8-sig"),
                               parse_constant=invalid_constant,
                               object_pairs_hook=unique_keys)
            if not isinstance(value, dict):
                error(label, "JSON root must be an object")
                return {}
            return value
        except (OSError, ValueError, UnicodeError):
            error(label, "cannot read a valid JSON object")
            return {}

    registry = read(root / "previews" / "registry.json")
    if type(registry.get("schema_version")) is not int or registry.get("schema_version") != 1:
        error("registry", "schema_version must be integer 1")
    templates = registry.get("templates")
    if not isinstance(templates, dict) or not templates:
        error("registry", "templates must be a nonempty object")
        templates = {}
    for template_id, template in templates.items():
        label = f"template {template_id}"
        if not SLUG.fullmatch(template_id) or not isinstance(template, dict):
            error(label, "invalid ID or template object")
            continue
        if type(template.get("version")) is not int or template["version"] < 1:
            error(label, "version must be a positive integer")
        specs = template.get("params")
        if not isinstance(specs, dict):
            error(label, "params must be an object")
            continue
        for name, spec in specs.items():
            if not PARAM.fullmatch(name):
                error(label, "invalid parameter name")
            problem = parameter_error(spec, spec.get("default") if isinstance(spec, dict) else None)
            if problem:
                error(f"{label}.{name}", problem)

    files = sorted((root / "content" / "items").rglob("*.json"))
    if not files:
        error("content/items", "no entry JSON files found")
    for path in files:
        count += 1
        label = path.relative_to(root).as_posix()
        item = read(path)
        item_id = item.get("id")
        if not isinstance(item_id, str) or not SLUG.fullmatch(item_id):
            error(label, "id must be a stable lowercase slug")
        else:
            if item_id != path.stem:
                error(label, "filename must match id")
            if item_id in items:
                error(label, "duplicate entry id")
            else:
                items[item_id] = (label, item)
        if type(item.get("schema_version")) is not int or item.get("schema_version") != 1:
            error(label, "schema_version must be integer 1")
        if item.get("kind") not in ("term", "effect", "ux-pattern"):
            error(label, "unsupported kind")
        if item.get("domain") not in ("ui", "ux"):
            error(label, "domain must be ui or ux")
        if not isinstance(item.get("category"), str) or not SLUG.fullmatch(item["category"]):
            error(label, "category must be a lowercase slug")
        if item.get("status") not in ("draft", "published"):
            error(label, "status must be draft or published")
        if publish and item.get("status") != "published":
            error(label, "publish check requires published status")
        if not text(item.get("canonical_name")):
            error(label, "canonical_name is required")
        for field in ("tags", "related_ids"):
            if not strings(item.get(field)):
                error(label, f"{field} must be a string list")

        specs = {}
        preview = item.get("preview")
        if preview is None:
            if item.get("kind") in ("effect", "ux-pattern"):
                error(label, "this kind requires a preview template")
        elif not isinstance(preview, dict):
            error(label, "preview must be null or an object")
        else:
            template_id = preview.get("template_id")
            template = templates.get(template_id) if isinstance(template_id, str) else None
            if not isinstance(template, dict) or not isinstance(template.get("params"), dict):
                error(label, "preview references an unknown or invalid template")
            else:
                specs = template["params"]
            values = preview.get("params")
            if not isinstance(values, dict):
                error(label, "preview params must be an object")
                values = {}
            for name, value in values.items():
                if name not in specs:
                    error(label, f"unregistered preview parameter {name}")
                else:
                    problem = parameter_error(specs[name], value)
                    if problem:
                        error(f"{label}.{name}", problem)

        locales = item.get("locales")
        if not isinstance(locales, dict) or not locales:
            error(label, "locales must be a nonempty object")
            locales = {}
        for locale in locales:
            if locale not in LOCALES:
                error(label, f"unsupported content locale {locale}")
        for locale in LOCALES:
            if locale not in locales:
                warnings.append(f"{label}: {locale} content missing; explicit English fallback required")
        for locale in required_locales:
            value = locales.get(locale)
            if publish and (not isinstance(value, dict) or value.get("review_status") != "reviewed"):
                error(label, f"publish check requires reviewed {locale} content")
        for locale, value in locales.items():
            loc_label = f"{label}.{locale}"
            if not isinstance(value, dict):
                error(loc_label, "locale content must be an object")
                continue
            if value.get("review_status") not in ("draft", "reviewed"):
                error(loc_label, "review_status must be draft or reviewed")
            elif value["review_status"] == "draft":
                warnings.append(f"{loc_label}: translation pending review")
            for field in ("name", "description"):
                if not text(value.get(field)):
                    error(loc_label, f"{field} is required")
            for field in ("aliases", "use_when", "avoid_when"):
                if not strings(value.get(field)):
                    error(loc_label, f"{field} must be a string list")
            prompt = value.get("prompt_template")
            if not isinstance(prompt, str) or (preview is not None and not prompt.strip()):
                error(loc_label, "prompt_template is required for previews")
                continue
            fields = set()
            try:
                for _, field, format_spec, conversion in string.Formatter().parse(prompt):
                    if field is not None:
                        fields.add(field)
                        if field not in specs or format_spec or conversion:
                            error(loc_label, "prompt contains an unknown or unsafe parameter expression")
                for name in specs:
                    if name not in fields:
                        error(loc_label, f"prompt omits preview parameter {name}")
            except ValueError:
                error(loc_label, "prompt contains malformed braces")

        sources = item.get("sources")
        if not isinstance(sources, list) or not sources:
            error(label, "at least one source record is required")
            sources = []
        for source in sources:
            if not isinstance(source, dict):
                error(label, "source record must be an object")
                continue
            kind = source.get("type")
            if kind not in ("original", "reference", "adapted"):
                error(label, "invalid source type")
            for field in ("note", "license"):
                if not text(source.get(field)):
                    error(label, f"source {field} is required")
            if source.get("reuse_permission") not in ("not-applicable", "verified", "pending"):
                error(label, "invalid reuse_permission")
            url = source.get("url")
            if kind != "original" or url is not None:
                try:
                    parsed = urlparse(url) if isinstance(url, str) else None
                except ValueError:
                    parsed = None
                if parsed is None or parsed.scheme not in ("http", "https") or not parsed.netloc:
                    error(label, "external source requires an HTTP/HTTPS page URL")
            if kind == "adapted" and (source.get("license") == "unknown" or source.get("reuse_permission") != "verified"):
                message = f"{label}: adapted material needs verified reuse metadata"
                (errors if publish else warnings).append(message)

    for label, item in items.values():
        if strings(item.get("related_ids")):
            for related in item["related_ids"]:
                if related not in items:
                    error(label, f"related entry does not exist: {related}")
    return {"status": "fail" if errors else "pass", "checked_entries": count,
            "publish_check": publish, "errors": errors, "warnings": warnings}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path, help="Folder containing content/items and previews/registry.json")
    parser.add_argument("--publish-check", action="store_true", help="Strict read-only check; does not deploy")
    parser.add_argument("--require-locales", nargs="+", choices=LOCALES, default=["zh-CN", "en"])
    args = parser.parse_args()
    report = inspect_pack(args.root, args.publish_check, args.require_locales)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 1 if report["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
