from typing import Tuple, Optional
import math
from rapidfuzz import fuzz
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from PIL import Image
import io
import urllib.request
from app.services.normalizer import normalize_text, normalize_handle

def calculate_name_similarity(candidate_name: str, brand_name: str, brand_aliases: list[str] = None) -> Tuple[float, str]:
    """
    Computes name similarity score (0.0 to 100.0) between candidate name and brand name/aliases.
    Returns (score, explanation).
    """
    if not candidate_name or not brand_name:
        return 0.0, "Missing name data."

    norm_cand = normalize_text(candidate_name)
    norm_brand = normalize_text(brand_name)

    names_to_test = [norm_brand]
    if brand_aliases:
        for alias in brand_aliases:
            norm_a = normalize_text(alias)
            if norm_a:
                names_to_test.append(norm_a)

    best_score = 0.0
    best_match_name = brand_name
    match_type = ""

    for target in names_to_test:
        # Full ratio
        r = fuzz.ratio(norm_cand, target)
        # Token sort ratio (handles word reordering)
        tsr = fuzz.token_sort_ratio(norm_cand, target)
        # Partial ratio (handles substring matching, e.g. "Apex Bank Customer Care" contains "Apex Bank")
        pr = fuzz.partial_ratio(norm_cand, target)

        # Weighted combination: if target is full substring, give high score
        if target in norm_cand or norm_cand in target:
            combined = max(r, tsr, min(95.0, pr))
            curr_type = "Substring / brand containment"
        else:
            combined = (r * 0.5) + (tsr * 0.3) + (pr * 0.2)
            curr_type = "Fuzzy spelling variation"

        if combined > best_score:
            best_score = combined
            best_match_name = target
            match_type = curr_type

    explanation = f"{match_type} against '{best_match_name}' (Fuzzy similarity: {best_score:.1f}%)."
    return round(best_score, 1), explanation

def calculate_handle_similarity(candidate_handle: str, brand_handle: str) -> Tuple[float, str]:
    """Compare normalized social handles."""
    cand_h = normalize_handle(candidate_handle)
    brand_h = normalize_handle(brand_handle)

    if not cand_h or not brand_h:
        return 0.0, "Missing handle data."

    score = fuzz.ratio(cand_h, brand_h)
    explanation = f"Handle similarity between '@{cand_h}' and '@{brand_h}' is {score:.1f}%."
    return round(float(score), 1), explanation

def calculate_description_similarity(cand_desc: str, brand_desc: str) -> Tuple[float, str]:
    """
    Computes description similarity using TF-IDF cosine similarity.
    Only computes if both descriptions have sufficient text (>= 15 chars).
    """
    if not cand_desc or not brand_desc or len(cand_desc.strip()) < 15 or len(brand_desc.strip()) < 15:
        return 0.0, "Insufficient description text for comparative analysis."

    try:
        tfidf = TfidfVectorizer().fit_transform([cand_desc, brand_desc])
        sim_matrix = cosine_similarity(tfidf[0:1], tfidf[1:2])
        score = float(sim_matrix[0][0]) * 100.0
        return round(score, 1), f"TF-IDF cosine similarity between profile descriptions: {score:.1f}%."
    except Exception as e:
        return 0.0, f"Error analyzing description: {str(e)}"

def compute_image_dhash(image: Image.Image, hash_size: int = 8) -> int:
    """Compute difference hash (dHash) for an image."""
    # Resize to (hash_size + 1, hash_size) and convert to grayscale
    resized = image.convert("L").resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
    pixels = list(resized.getdata())
    # Compare adjacent pixels
    difference = []
    for row in range(hash_size):
        for col in range(hash_size):
            pixel_left = pixels[row * (hash_size + 1) + col]
            pixel_right = pixels[row * (hash_size + 1) + col + 1]
            difference.append(pixel_left > pixel_right)
    # Convert binary array to integer
    decimal_val = 0
    for idx, val in enumerate(difference):
        if val:
            decimal_val += 1 << idx
    return decimal_val

def compare_images(image1: Image.Image, image2: Image.Image, hash_size: int = 8) -> Tuple[float, str]:
    """Compare two PIL Images using dHash Hamming distance. Returns similarity percentage."""
    hash1 = compute_image_dhash(image1, hash_size)
    hash2 = compute_image_dhash(image2, hash_size)
    total_bits = hash_size * hash_size
    # Hamming distance
    diff_bits = bin(hash1 ^ hash2).count("1")
    similarity = max(0.0, (1.0 - (diff_bits / total_bits)) * 100.0)
    return round(similarity, 1), f"Image perceptual hash similarity: {similarity:.1f}% (Hamming distance: {diff_bits}/{total_bits} bits)."
