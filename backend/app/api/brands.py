from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import (
    Brand, OfficialSocialAsset, OfficialAppAsset, ApprovedAsset, Finding
)
from app.schemas.schemas import (
    BrandResponse, BrandCreate, BrandUpdate,
    OfficialSocialAssetCreate, OfficialSocialAssetResponse,
    OfficialAppAssetCreate, OfficialAppAssetResponse,
    ApprovedAssetCreate, ApprovedAssetResponse
)

router = APIRouter(prefix="/brands", tags=["Brands"])

@router.get("", response_model=List[BrandResponse])
def get_brands(
    sector_id: Optional[str] = None,
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List protected brands with filtering and identity asset details."""
    query = db.query(Brand)
    if sector_id:
        query = query.filter(Brand.sector_id == sector_id)
    if status:
        query = query.filter(Brand.monitoring_status == status)
    if search:
        query = query.filter(Brand.name.ilike(f"%{search}%"))

    brands = query.order_by(Brand.id.asc()).all()
    results = []
    for b in brands:
        f_count = db.query(Finding).filter(Finding.brand_id == b.id).count()
        resp = BrandResponse.model_validate(b)
        resp.findings_count = f_count
        results.append(resp)
    return results

@router.get("/{brand_id}", response_model=BrandResponse)
def get_brand(brand_id: int, db: Session = Depends(get_db)):
    """Fetch complete brand profile with identity fingerprint."""
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    f_count = db.query(Finding).filter(Finding.brand_id == brand.id).count()
    resp = BrandResponse.model_validate(brand)
    resp.findings_count = f_count
    return resp

@router.post("", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
def create_brand(payload: BrandCreate, db: Session = Depends(get_db)):
    """Registers a new protected brand profile and official assets."""
    existing = db.query(Brand).filter(Brand.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="A brand with this name is already registered.")

    brand = Brand(
        name=payload.name,
        sector_id=payload.sector_id,
        description=payload.description or "",
        official_website=payload.official_website,
        approved_domains=payload.approved_domains or [],
        logo_url=payload.logo_url,
        official_developer=payload.official_developer or "",
        aliases=payload.aliases or [],
        keywords=payload.keywords or [],
        monitoring_status=payload.monitoring_status or "active"
    )
    db.add(brand)
    db.flush()

    if payload.social_assets:
        for sa in payload.social_assets:
            db.add(OfficialSocialAsset(
                brand_id=brand.id,
                platform=sa.platform,
                handle=sa.handle,
                profile_url=sa.profile_url,
                is_primary=sa.is_primary
            ))

    if payload.app_assets:
        for aa in payload.app_assets:
            db.add(OfficialAppAsset(
                brand_id=brand.id,
                app_name=aa.app_name,
                store=aa.store,
                package_id=aa.package_id,
                app_url=aa.app_url,
                developer_name=aa.developer_name
            ))

    db.commit()
    db.refresh(brand)
    return brand

@router.patch("/{brand_id}", response_model=BrandResponse)
def update_brand(brand_id: int, payload: BrandUpdate, db: Session = Depends(get_db)):
    """Updates brand profile metadata."""
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    if payload.name is not None:
        brand.name = payload.name
    if payload.sector_id is not None:
        brand.sector_id = payload.sector_id
    if payload.description is not None:
        brand.description = payload.description
    if payload.official_website is not None:
        brand.official_website = payload.official_website
    if payload.approved_domains is not None:
        brand.approved_domains = payload.approved_domains
    if payload.logo_url is not None:
        brand.logo_url = payload.logo_url
    if payload.official_developer is not None:
        brand.official_developer = payload.official_developer
    if payload.aliases is not None:
        brand.aliases = payload.aliases
    if payload.keywords is not None:
        brand.keywords = payload.keywords
    if payload.monitoring_status is not None:
        brand.monitoring_status = payload.monitoring_status

    db.commit()
    db.refresh(brand)
    return brand

@router.delete("/{brand_id}")
def delete_brand(
    brand_id: int,
    force: bool = Query(False, description="Force delete brand and all related findings"),
    db: Session = Depends(get_db)
):
    """Deletes brand profile with safety checks for associated findings."""
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    findings_count = db.query(Finding).filter(Finding.brand_id == brand_id).count()
    if findings_count > 0 and not force:
        raise HTTPException(
            status_code=409,
            detail=f"Brand has {findings_count} associated findings. Set query param '?force=true' to proceed with deletion."
        )

    db.delete(brand)
    db.commit()
    return {"message": f"Brand '{brand.name}' deleted successfully."}

# Sub-resources: Official Social Assets
@router.post("/{brand_id}/social-assets", response_model=OfficialSocialAssetResponse)
def add_social_asset(brand_id: int, payload: OfficialSocialAssetCreate, db: Session = Depends(get_db)):
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    asset = OfficialSocialAsset(
        brand_id=brand_id,
        platform=payload.platform,
        handle=payload.handle,
        profile_url=payload.profile_url,
        is_primary=payload.is_primary
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset

@router.delete("/{brand_id}/social-assets/{asset_id}")
def delete_social_asset(brand_id: int, asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(OfficialSocialAsset).filter(
        OfficialSocialAsset.id == asset_id,
        OfficialSocialAsset.brand_id == brand_id
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Social asset not found")
    db.delete(asset)
    db.commit()
    return {"message": "Official social asset removed"}

# Sub-resources: Official App Assets
@router.post("/{brand_id}/app-assets", response_model=OfficialAppAssetResponse)
def add_app_asset(brand_id: int, payload: OfficialAppAssetCreate, db: Session = Depends(get_db)):
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    asset = OfficialAppAsset(
        brand_id=brand_id,
        app_name=payload.app_name,
        store=payload.store,
        package_id=payload.package_id,
        app_url=payload.app_url,
        developer_name=payload.developer_name
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset

@router.delete("/{brand_id}/app-assets/{asset_id}")
def delete_app_asset(brand_id: int, asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(OfficialAppAsset).filter(
        OfficialAppAsset.id == asset_id,
        OfficialAppAsset.brand_id == brand_id
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="App asset not found")
    db.delete(asset)
    db.commit()
    return {"message": "Official app asset removed"}

# Sub-resources: Approved Whitelist Assets
@router.post("/{brand_id}/approved-assets", response_model=ApprovedAssetResponse)
def add_approved_asset(brand_id: int, payload: ApprovedAssetCreate, db: Session = Depends(get_db)):
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    asset = ApprovedAsset(
        brand_id=brand_id,
        asset_type=payload.asset_type,
        identifier=payload.identifier,
        reason=payload.reason,
        approved_by=payload.approved_by or "analyst"
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset

@router.delete("/{brand_id}/approved-assets/{asset_id}")
def delete_approved_asset(brand_id: int, asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(ApprovedAsset).filter(
        ApprovedAsset.id == asset_id,
        ApprovedAsset.brand_id == brand_id
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Approved asset not found")
    db.delete(asset)
    db.commit()
    return {"message": "Approved asset removed"}
