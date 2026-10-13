import re
from urllib.parse import urlparse

LEET_MAP = {
    '0': 'o',
    '1': 'l',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '7': 't',
    '8': 'b',
    '@': 'a',
    '$': 's'
}

def normalize_text(text: str) -> str:
    """Normalize text for consistent comparison: lowercase, trim, strip punctuation."""
    if not text:
        return ""
    text = text.lower().strip()
    # Replace common leetspeak substitutions
    de_leeted = "".join(LEET_MAP.get(c, c) for c in text)
    # Remove excessive punctuation and multiple spaces
    cleaned = re.sub(r'[^a-z0-9\s]', ' ', de_leeted)
    return re.sub(r'\s+', ' ', cleaned).strip()

def normalize_handle(handle: str) -> str:
    """Normalize social handle: remove leading @, lowercase, remove delimiters."""
    if not handle:
        return ""
    handle = handle.lower().strip()
    if handle.startswith('@'):
        handle = handle[1:]
    # Remove dots, underscores, dashes for comparison
    return re.sub(r'[\._\-]', '', handle)

def normalize_url(url: str) -> str:
    """Normalize URL: lowercase, strip protocol and trailing slashes."""
    if not url:
        return ""
    url = url.lower().strip()
    # Remove protocol
    url = re.sub(r'^https?://(www\.)?', '', url)
    return url.rstrip('/')

def extract_domain(url_or_domain: str) -> str:
    """Extract registered base domain from URL or domain string."""
    if not url_or_domain:
        return ""
    text = url_or_domain.lower().strip()
    if not (text.startswith("http://") or text.startswith("https://")):
        text = "https://" + text
    try:
        parsed = urlparse(text)
        netloc = parsed.netloc or parsed.path
        netloc = re.sub(r'^www\.', '', netloc)
        return netloc.split(':')[0]
    except Exception:
        return url_or_domain.lower().strip()

def normalize_package_id(package_id: str) -> str:
    """Normalize mobile app package / bundle ID."""
    if not package_id:
        return ""
    return package_id.lower().strip()
