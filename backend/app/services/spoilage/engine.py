"""
Deterministic Spoilage Engine
Combines USDA FoodKeeper empirical shelf-life data with Indian kitchen staples baselines
and custom non-linear mathematical decay formulas to compute real-time freshness countdowns.
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
import math

from app.services.spoilage.foodkeeper_data import ITEM_SHELF_LIFE_DB, CATEGORY_BASELINES

class DeterministicSpoilageEngine:
    def __init__(self):
        self.item_db = ITEM_SHELF_LIFE_DB
        self.category_baselines = CATEGORY_BASELINES

    def get_baseline_shelf_life(self, item_name: str, category: str, location: str) -> Dict[str, Any]:
        """
        Match item against USDA FoodKeeper and Indian staples database,
        falling back to category standards.
        """
        clean_name = item_name.strip().lower()
        location_safe = location if location in ["Fridge", "Pantry", "Freezer"] else "Fridge"
        
        # Exact or substring match for food item
        matched_item = None
        # Check longest matching keys first for specificity (e.g. 'cooked dal' before 'dal')
        sorted_keys = sorted(self.item_db.keys(), key=len, reverse=True)
        for key in sorted_keys:
            if key in clean_name:
                matched_item = self.item_db[key]
                break

        if matched_item:
            baseline_days = matched_item.get(location_safe, matched_item.get("Fridge", 7.0))
            resolved_category = matched_item.get("category", category)
            notes = matched_item.get("notes", "USDA FoodKeeper / Indian Kitchen baseline.")
            matched_key = matched_item.get("name", item_name)
        else:
            cat_safe = category if category in self.category_baselines else "Other"
            cat_defaults = self.category_baselines[cat_safe]
            baseline_days = cat_defaults.get(location_safe, 7.0)
            resolved_category = cat_safe
            notes = f"Category baseline for {cat_safe}."
            matched_key = item_name

        return {
            "baseline_days": float(baseline_days),
            "category": resolved_category,
            "matched_item": matched_key,
            "notes": notes
        }

    def calculate_spoilage(
        self,
        item_name: str,
        category: str,
        location: str,
        purchase_date: Optional[datetime] = None,
        custom_expiry: Optional[datetime] = None,
        temp_factor: float = 1.0
    ) -> Dict[str, Any]:
        """
        Calculates real-time expiration countdown and non-linear freshness degradation percentage.
        
        Mathematical Decay Formula:
        Quality follows a biological Weibull/Arrhenius degradation curve:
        ratio = max(0, 1 - (days_elapsed / effective_shelf_life))
        freshness_pct = (ratio ** 1.18) * 100.0
        """
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        if not purchase_date:
            purchase_date = now

        meta = self.get_baseline_shelf_life(item_name, category, location)
        base_days = meta["baseline_days"]

        # If user explicitly provided custom expiration
        if custom_expiry:
            diff_days = (custom_expiry - purchase_date).total_seconds() / 86400.0
            if diff_days > 0.1:
                base_days = diff_days

        # Temperature perturbation factor (e.g. 1.0 = standard, 1.2 = warm/stressed, 0.9 = optimal deep chill)
        effective_temp_factor = max(0.5, min(2.0, temp_factor))
        effective_shelf_life = max(0.5, base_days / effective_temp_factor)

        # Elapsed time in seconds & days
        elapsed_seconds = max(0.0, (now - purchase_date).total_seconds())
        days_elapsed = elapsed_seconds / 86400.0

        # Remaining days & hours
        raw_days_left = effective_shelf_life - days_elapsed
        days_remaining = max(0.0, round(raw_days_left, 1))
        hours_remaining = max(0.0, round(raw_days_left * 24.0, 1))

        # Degradation ratio
        ratio = max(0.0, min(1.0, 1.0 - (days_elapsed / effective_shelf_life)))
        # Non-linear accelerated microbial/enzymatic spoilage decay curve
        freshness_pct = round(math.pow(ratio, 1.18) * 100.0, 1)

        # Classify status & urgency
        if days_remaining <= 0.0 or freshness_pct <= 0.0:
            urgency = "expired"
            status_badge = "Expired - Upcycle"
            color_hex = "#6B7280" # Slate Gray
        elif days_remaining <= 2.5 or freshness_pct < 30.0:
            urgency = "critical"
            status_badge = "Expires Today/Tomorrow"
            color_hex = "#EF4444" # Rose / Red
        elif days_remaining <= 6.0 or freshness_pct < 65.0:
            urgency = "moderate"
            status_badge = "Use Soon"
            color_hex = "#F59E0B" # Amber
        else:
            urgency = "fresh"
            status_badge = "Peak Freshness"
            color_hex = "#10B981" # Emerald Green

        predicted_expiry = purchase_date + timedelta(days=effective_shelf_life)

        return {
            "freshness_score": freshness_pct,
            "days_remaining": days_remaining,
            "hours_remaining": hours_remaining,
            "shelf_life_days": int(round(effective_shelf_life)),
            "days_elapsed": round(days_elapsed, 1),
            "urgency": urgency,
            "status_badge": status_badge,
            "color_hex": color_hex,
            "predicted_expiry_date": predicted_expiry.isoformat(),
            "matched_standard": meta["matched_item"],
            "storage_tips": meta["notes"],
            "decay_model": "Deterministic USDA + Indian Staples Decay"
        }

    def generate_simulation_curve(
        self,
        item_name: str,
        category: str,
        location: str,
        temp_factor: float = 1.0,
        days_ahead: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generates simulated decay datapoints for visualization in Freshness Radar.
        """
        meta = self.get_baseline_shelf_life(item_name, category, location)
        effective_days = int(round(meta["baseline_days"] / max(0.5, temp_factor)))
        total_days = days_ahead if days_ahead else (effective_days + 3)

        curve = []
        for d in range(total_days + 1):
            ratio = max(0.0, 1.0 - (d / max(1.0, effective_days)))
            pct = round(math.pow(ratio, 1.18) * 100.0, 1)
            
            if pct >= 65.0:
                status = "Peak"
            elif pct >= 25.0:
                status = "Use Soon"
            else:
                status = "Past Prime"

            curve.append({
                "day": f"Day {d}",
                "day_number": d,
                "freshness": pct,
                "status": status
            })

        return {
            "item_name": item_name,
            "location": location,
            "effective_shelf_life_days": effective_days,
            "simulation_curve": curve,
            "storage_advice": meta["notes"]
        }

# Global singleton engine
spoilage_engine = DeterministicSpoilageEngine()
