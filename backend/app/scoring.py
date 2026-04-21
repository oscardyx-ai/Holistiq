from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any

from backend.app.models import CheckInPeriod, ConnectedAppSource

FACTOR_CONFIG = [
    {"key": "pain", "label": "Pain", "color": "#be6a4c"},
    {"key": "mental", "label": "Mental Health", "color": "#6d8f5d"},
    {"key": "social", "label": "Social", "color": "#8e7dbd"},
    {"key": "lifestyle", "label": "Lifestyle", "color": "#d09045"},
    {"key": "diet", "label": "Diet", "color": "#6ea06c"},
    {"key": "environment", "label": "Environment", "color": "#73a8a4"},
    {"key": "medication", "label": "Medication", "color": "#618bc0"},
    {"key": "activity", "label": "Activity", "color": "#c27d8d"},
]
FACTOR_KEYS = [factor["key"] for factor in FACTOR_CONFIG]

ENERGY_OPTIONS = ["Terrible", "Bad", "Neutral", "Good", "Great"]
SLEEP_OPTIONS = ["Terrible", "Bad", "Neutral", "Good", "Great"]
SOCIAL_CONNECTION_OPTIONS = [
    "Not at all connected",
    "A little connected",
    "Moderately connected",
    "Very connected",
]
ROUTINE_OPTIONS = ["Off track", "Uneven", "Okay", "Strong"]
MEAL_OPTIONS = ["Not at all balanced", "A little balanced", "Mostly balanced", "Very balanced"]
ENVIRONMENT_OPTIONS = ["Very poor", "Poor", "Okay", "Good", "Excellent"]
ACTIVITY_OPTIONS = ["None", "Light", "Moderate", "High"]
WEEKLY_SOCIALIZE_OPTIONS = ["None", "Very little", "Some", "A lot"]
WEEKLY_TIME_OPTIONS = ["None", "1-3 hours", "3-5 hours", "5+ hours"]
WEEKLY_ROUTINE_OPTIONS = ["Not regular", "Slightly regular", "Moderately regular", "Very regular"]
WEEKLY_FOOD_OPTIONS = ["Rarely", "Sometimes", "Often", "Almost always"]
WEEKLY_ENVIRONMENT_OPTIONS = ["Never", "Sometimes", "Often", "Almost always"]
WEEKLY_MEDICATION_OPTIONS = ["Not at all", "Some days", "Most days", "Every day"]
WEEKLY_MOVEMENT_OPTIONS = ["0 days", "1-2 days", "3-4 days", "5+ days"]

NEGATIVE_FEELING_IMPACTS = {
    "Sad": [{"factor": "mental", "penalty": 18}],
    "Lonely": [{"factor": "mental", "penalty": 14}, {"factor": "social", "penalty": 18}],
    "Angry": [{"factor": "mental", "penalty": 15}, {"factor": "environment", "penalty": 8}],
    "Discouraged": [{"factor": "mental", "penalty": 16}, {"factor": "lifestyle", "penalty": 8}],
    "Hurt": [{"factor": "mental", "penalty": 10}, {"factor": "pain", "penalty": 14}],
}

SUBSTANCE_RISK = [
    {"keywords": ["nicotine", "vape", "cigarette"], "score": 45},
    {"keywords": ["marijuana", "cannabis", "weed"], "score": 55},
    {"keywords": ["pain killer", "painkiller", "opioid", "oxycodone", "morphine"], "score": 20},
    {"keywords": ["cocaine", "meth", "heroin", "fentanyl"], "score": 5},
    {"keywords": ["alcohol"], "score": 50},
]


@dataclass
class SessionInput:
    entry_date: date
    period: CheckInPeriod
    answers: dict[str, Any]
    completed_at: datetime


@dataclass
class SnapshotInput:
    snapshot_date: date
    source: ConnectedAppSource
    payload: dict[str, Any]


def clamp_score(score: float) -> int:
    return max(0, min(100, round(score)))


def average(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def normalize_score(value: float, min_value: float, max_value: float) -> int:
    if max_value == min_value:
        return 50
    return clamp_score(((value - min_value) / (max_value - min_value)) * 100)


def invert_score(value: float, min_value: float, max_value: float) -> int:
    return 100 - normalize_score(value, min_value, max_value)


def create_observations(score: float, factors: list[dict[str, float]], source: str) -> list[dict[str, Any]]:
    return [
        {"factor": factor["factor"], "score": clamp_score(score), "weight": factor["weight"], "source": source}
        for factor in factors
    ]


def get_choice_score(answer: str, options: list[str]) -> int:
    try:
        index = options.index(answer)
    except ValueError:
        return 50
    return normalize_score(index, 0, max(1, len(options) - 1))


def get_custom_substance_score(custom_substance: str) -> int:
    stripped = custom_substance.strip()
    if not stripped:
        return 70
    lowered = stripped.lower()
    for entry in SUBSTANCE_RISK:
        if any(keyword in lowered for keyword in entry["keywords"]):
            return entry["score"]
    return 40


def substance_frequency_score(frequency: str) -> int:
    return {"None": 100, "1-3 times": 70, "3-5 times": 45, "5+ times": 20}.get(frequency, 50)


def dampened_penalty(values: list[int]) -> float:
    total = 0.0
    for index, value in enumerate(sorted(values, key=abs, reverse=True)):
        total += value * (0.65 ** index)
    return total


def score_negative_feelings(selected_feelings: list[str]) -> list[dict[str, Any]]:
    penalties_by_factor: dict[str, list[int]] = defaultdict(list)
    for item in selected_feelings:
        for impact in NEGATIVE_FEELING_IMPACTS.get(item, []):
            penalties_by_factor[impact["factor"]].append(impact["penalty"])

    return [
        {
            "factor": factor,
            "score": clamp_score(100 - dampened_penalty(penalties)),
            "weight": 1.1,
            "source": "Weekly feelings follow-up",
        }
        for factor, penalties in penalties_by_factor.items()
    ]


def score_connected_apps(snapshots: list[SnapshotInput]) -> list[dict[str, Any]]:
    data_by_source = {snapshot.source: snapshot.payload for snapshot in snapshots}
    observations: list[dict[str, Any]] = []

    nutrition = data_by_source.get(ConnectedAppSource.MYFITNESSPAL)
    if nutrition:
        sodium = float(nutrition.get("sodiumMg", 0))
        sodium_target = float(nutrition.get("targetSodiumMg", 2300))
        produce = float(nutrition.get("produceServings", 0))
        sodium_delta = max(0, sodium - sodium_target)
        diet_score = clamp_score(82 - sodium_delta / 40 + produce * 4)
        observations.append({"factor": "diet", "score": diet_score, "weight": 0.8, "source": "MyFitnessPal"})

    wearable = data_by_source.get(ConnectedAppSource.WEARABLE)
    if wearable:
        steps = float(wearable.get("steps", 0))
        active_minutes = float(wearable.get("activeMinutes", 0))
        sleep_hours = float(wearable.get("sleepHours", 0))
        activity_score = clamp_score(
            normalize_score(steps, 2500, 11000) * 0.55 + normalize_score(active_minutes, 10, 65) * 0.45
        )
        lifestyle_score = clamp_score(
            normalize_score(sleep_hours, 4.5, 8.5) * 0.55 + normalize_score(active_minutes, 10, 65) * 0.45
        )
        observations.extend(
            [
                {"factor": "activity", "score": activity_score, "weight": 0.7, "source": "Wearable activity"},
                {"factor": "lifestyle", "score": lifestyle_score, "weight": 0.6, "source": "Wearable routine"},
            ]
        )

    medication = data_by_source.get(ConnectedAppSource.MEDICATION_TRACKER)
    if medication:
        adherence = clamp_score(float(medication.get("adherencePercent", 0)))
        observations.append(
            {"factor": "medication", "score": adherence, "weight": 0.7, "source": "Medication tracker"}
        )

    environment = data_by_source.get(ConnectedAppSource.ENVIRONMENT_JOURNAL)
    if environment:
        calmness = clamp_score(float(environment.get("calmnessScore", 0)))
        observations.append(
            {"factor": "environment", "score": calmness, "weight": 0.5, "source": "Environment journal"}
        )

    return observations


def get_daily_answer_prefix(period: CheckInPeriod) -> str | None:
    if period == CheckInPeriod.MORNING:
        return "morning"
    if period == CheckInPeriod.NIGHT:
        return "night"
    return None


def has_answer(answers: dict[str, Any], key: str) -> bool:
    return key in answers and answers[key] is not None


def evaluate_daily_answers(period: CheckInPeriod, answers: dict[str, Any]) -> list[dict[str, Any]]:
    prefix = get_daily_answer_prefix(period)
    observations: list[dict[str, Any]] = []

    if prefix is None:
        return observations

    feeling_key = f"{prefix}_feeling"
    if has_answer(answers, feeling_key):
        observations.extend(
            create_observations(
                normalize_score(float(answers[feeling_key]), 1, 10),
                [{"factor": "mental", "weight": 1.3}, {"factor": "lifestyle", "weight": 0.4}],
                "How are you feeling today?",
            )
        )

    energy_key = f"{prefix}_energy"
    if has_answer(answers, energy_key):
        observations.extend(
            create_observations(
                get_choice_score(str(answers[energy_key]), ENERGY_OPTIONS),
                [
                    {"factor": "lifestyle", "weight": 1.1},
                    {"factor": "activity", "weight": 0.4},
                    {"factor": "mental", "weight": 0.35},
                ],
                "How is your energy?",
            )
        )

    sleep_key = f"{prefix}_sleep"
    if has_answer(answers, sleep_key):
        observations.extend(
            create_observations(
                get_choice_score(str(answers[sleep_key]), SLEEP_OPTIONS),
                [
                    {"factor": "lifestyle", "weight": 1.1},
                    {"factor": "environment", "weight": 0.4},
                    {"factor": "mental", "weight": 0.3},
                ],
                "How was your sleep?",
            )
        )

    pain_key = f"{prefix}_pain"
    if has_answer(answers, pain_key):
        observations.extend(
            create_observations(
                invert_score(float(answers[pain_key]), 0, 10),
                [{"factor": "pain", "weight": 1.3}, {"factor": "mental", "weight": 0.35}],
                "How intense was your pain today?",
            )
        )

    stress_key = f"{prefix}_stress"
    if has_answer(answers, stress_key):
        observations.extend(
            create_observations(
                invert_score(float(answers[stress_key]), 1, 10),
                [
                    {"factor": "mental", "weight": 1.1},
                    {"factor": "environment", "weight": 0.35},
                    {"factor": "lifestyle", "weight": 0.3},
                ],
                "How stressful did the day feel?",
            )
        )

    connection_key = f"{prefix}_social_connection"
    if has_answer(answers, connection_key):
        observations.extend(
            create_observations(
                get_choice_score(str(answers[connection_key]), SOCIAL_CONNECTION_OPTIONS),
                [{"factor": "social", "weight": 1.2}, {"factor": "mental", "weight": 0.35}],
                "How connected did you feel to other people today?",
            )
        )

    routine_key = f"{prefix}_routine"
    if has_answer(answers, routine_key):
        observations.extend(
            create_observations(
                get_choice_score(str(answers[routine_key]), ROUTINE_OPTIONS),
                [{"factor": "lifestyle", "weight": 1.15}, {"factor": "mental", "weight": 0.25}],
                "How well did your routine support you today?",
            )
        )

    meals_key = f"{prefix}_meals"
    if has_answer(answers, meals_key):
        observations.extend(
            create_observations(
                get_choice_score(str(answers[meals_key]), MEAL_OPTIONS),
                [{"factor": "diet", "weight": 1.2}, {"factor": "lifestyle", "weight": 0.3}],
                "How balanced were your meals today?",
            )
        )

    environment_key = f"{prefix}_environment"
    if has_answer(answers, environment_key):
        observations.extend(
            create_observations(
                get_choice_score(str(answers[environment_key]), ENVIRONMENT_OPTIONS),
                [{"factor": "environment", "weight": 1.15}, {"factor": "mental", "weight": 0.25}],
                "How comfortable and calm did your environment feel today?",
            )
        )

    medication_key = f"{prefix}_medication"
    if has_answer(answers, medication_key):
        medication_answer = str(answers[medication_key])
        medication_score = get_choice_score(medication_answer, ["No", "Partly", "Yes", "Not applicable"])
        if medication_answer == "Not applicable":
            medication_score = 80
        observations.extend(
            create_observations(
                medication_score,
                [{"factor": "medication", "weight": 1.2}, {"factor": "lifestyle", "weight": 0.2}],
                "Did you take your medications as planned today?",
            )
        )

    activity_key = f"{prefix}_activity"
    if has_answer(answers, activity_key):
        observations.extend(
            create_observations(
                get_choice_score(str(answers[activity_key]), ACTIVITY_OPTIONS),
                [{"factor": "activity", "weight": 1.2}, {"factor": "lifestyle", "weight": 0.35}],
                "How active were you today?",
            )
        )

    return observations


def evaluate_answers(period: CheckInPeriod, answers: dict[str, Any]) -> list[dict[str, Any]]:
    observations = evaluate_daily_answers(period, answers)

    if period == CheckInPeriod.WEEKLY:
        observations.extend(
            create_observations(
                normalize_score(float(answers.get("weekly_pain_manageability", 5)), 0, 10),
                [{"factor": "pain", "weight": 1.2}],
                "How manageable was your pain this week?",
            )
        )
        observations.extend(
            create_observations(
                normalize_score(float(answers.get("weekly_mental_health", 5)), 0, 10),
                [{"factor": "mental", "weight": 1.35}, {"factor": "social", "weight": 0.15}],
                "How would you rate your mental health this week?",
            )
        )
        observations.extend(
            create_observations(
                get_choice_score(str(answers.get("weekly_socialize", WEEKLY_SOCIALIZE_OPTIONS[0])), WEEKLY_SOCIALIZE_OPTIONS),
                [{"factor": "social", "weight": 1.1}, {"factor": "mental", "weight": 0.2}],
                "How much did you socialize this week?",
            )
        )
        substance_answer = answers.get("weekly_substances", {}) or {}
        selected_scores = [get_custom_substance_score(item) for item in substance_answer.get("substances", [])] or [100]
        custom_score = get_custom_substance_score(str(substance_answer.get("customSubstance", "")))
        base_score = substance_frequency_score(str(substance_answer.get("frequency", "None")))
        overall_substance_score = clamp_score(average(selected_scores + [custom_score, base_score]))
        observations.extend(
            create_observations(
                overall_substance_score,
                [
                    {"factor": "lifestyle", "weight": 1.1},
                    {"factor": "mental", "weight": 0.35},
                    {"factor": "pain", "weight": 0.25},
                ],
                "Recreational substance use",
            )
        )
        feelings = answers.get("weekly_feelings_follow_up", []) or []
        if isinstance(feelings, list):
            observations.extend(score_negative_feelings(feelings))
        observations.extend(
            create_observations(
                get_choice_score(str(answers.get("weekly_time_with_others", WEEKLY_TIME_OPTIONS[0])), WEEKLY_TIME_OPTIONS),
                [{"factor": "social", "weight": 1.1}, {"factor": "mental", "weight": 0.2}],
                "How much time did you spend with family and friends?",
            )
        )
        observations.extend(
            create_observations(
                get_choice_score(str(answers.get("weekly_routine", WEEKLY_ROUTINE_OPTIONS[0])), WEEKLY_ROUTINE_OPTIONS),
                [{"factor": "lifestyle", "weight": 1.15}, {"factor": "mental", "weight": 0.2}],
                "How regular was your daily routine this week?",
            )
        )
        observations.extend(
            create_observations(
                get_choice_score(str(answers.get("weekly_food_support", WEEKLY_FOOD_OPTIONS[0])), WEEKLY_FOOD_OPTIONS),
                [{"factor": "diet", "weight": 1.15}, {"factor": "lifestyle", "weight": 0.2}],
                "How often did your food choices support your health goals this week?",
            )
        )
        observations.extend(
            create_observations(
                get_choice_score(
                    str(answers.get("weekly_environment_support", WEEKLY_ENVIRONMENT_OPTIONS[0])),
                    WEEKLY_ENVIRONMENT_OPTIONS,
                ),
                [{"factor": "environment", "weight": 1.15}, {"factor": "mental", "weight": 0.2}],
                "How often did your environment help you feel settled this week?",
            )
        )
        observations.extend(
            create_observations(
                get_choice_score(
                    str(answers.get("weekly_medication_consistency", WEEKLY_MEDICATION_OPTIONS[0])),
                    WEEKLY_MEDICATION_OPTIONS,
                ),
                [{"factor": "medication", "weight": 1.2}],
                "How consistent were you with medications or care routines this week?",
            )
        )
        observations.extend(
            create_observations(
                get_choice_score(
                    str(answers.get("weekly_movement_frequency", WEEKLY_MOVEMENT_OPTIONS[0])),
                    WEEKLY_MOVEMENT_OPTIONS,
                ),
                [{"factor": "activity", "weight": 1.15}, {"factor": "lifestyle", "weight": 0.25}],
                "How often did you intentionally move your body this week?",
            )
        )

    return observations


def start_of_week(value: date) -> date:
    return value - timedelta(days=value.weekday())


def calculate_factor_scores_for_date(target_date: date, sessions: list[SessionInput], snapshots: list[SnapshotInput]) -> dict[str, Any]:
    target_week = start_of_week(target_date)
    relevant_sessions = [
        session
        for session in sessions
        if (session.entry_date == target_date and session.period in {CheckInPeriod.MORNING, CheckInPeriod.NIGHT})
        or (session.period == CheckInPeriod.WEEKLY and start_of_week(session.entry_date) == target_week)
    ]
    relevant_snapshots = [snapshot for snapshot in snapshots if snapshot.snapshot_date == target_date]

    observations: list[dict[str, Any]] = []
    for session in relevant_sessions:
        observations.extend(evaluate_answers(session.period, session.answers))
    observations.extend(score_connected_apps(relevant_snapshots))

    factor_scores: dict[str, int] = {}
    for factor_key in FACTOR_KEYS:
        relevant = [item for item in observations if item["factor"] == factor_key]
        if not relevant:
            factor_scores[factor_key] = 50
            continue
        weighted_total = sum(item["score"] * item["weight"] for item in relevant)
        total_weight = sum(item["weight"] for item in relevant)
        factor_scores[factor_key] = clamp_score(weighted_total / total_weight)

    return {
        "date": target_date,
        "factor_scores": factor_scores,
        "total_score": clamp_score(average(list(factor_scores.values()))),
        "observations": observations,
    }


def build_date_range(start: date, end: date, unit: str) -> list[date]:
    values: list[date] = []
    cursor = start
    while cursor <= end:
        values.append(cursor)
        if unit == "day":
            cursor += timedelta(days=1)
        elif unit == "week":
            cursor += timedelta(days=7)
        else:
            if cursor.month == 12:
                cursor = date(cursor.year + 1, 1, 1)
            else:
                cursor = date(cursor.year, cursor.month + 1, 1)
    return values


def format_short_date(value: date) -> str:
    return value.strftime("%b %d").replace(" 0", " ")


def calculate_trend_points(
    sessions: list[SessionInput],
    snapshots: list[SnapshotInput],
    range_key: str,
    reference_date: date,
) -> list[dict[str, Any]]:
    unit = "day"
    if range_key == "weekly":
        range_start = reference_date - timedelta(days=6)
        unit = "day"
    elif range_key == "monthly":
        range_start = reference_date - timedelta(days=28)
        unit = "week"
    else:
        range_start = date(reference_date.year, reference_date.month, 1)
        for _ in range(11):
            if range_start.month == 1:
                range_start = date(range_start.year - 1, 12, 1)
            else:
                range_start = date(range_start.year, range_start.month - 1, 1)
        unit = "month"

    points: list[dict[str, Any]] = []
    for bucket_date in build_date_range(range_start, reference_date, unit):
        if unit == "day":
            summary = calculate_factor_scores_for_date(bucket_date, sessions, snapshots)
            points.append(
                {
                    "label": format_short_date(bucket_date),
                    "period_key": bucket_date.isoformat(),
                    "factor_scores": summary["factor_scores"],
                    "total_score": summary["total_score"],
                }
            )
            continue

        if unit == "week":
            bucket_start = start_of_week(bucket_date)
            bucket_dates = [bucket_start + timedelta(days=offset) for offset in range(7) if bucket_start + timedelta(days=offset) <= reference_date]
            label = format_short_date(bucket_dates[0]) if bucket_dates else bucket_start.isoformat()
        else:
            bucket_start = date(bucket_date.year, bucket_date.month, 1)
            month_end = date(
                bucket_date.year + (1 if bucket_date.month == 12 else 0),
                1 if bucket_date.month == 12 else bucket_date.month + 1,
                1,
            ) - timedelta(days=1)
            bucket_dates = []
            cursor = bucket_start
            while cursor <= month_end and cursor <= reference_date:
                bucket_dates.append(cursor)
                cursor += timedelta(days=1)
            label = bucket_date.strftime("%b")

        summaries = [calculate_factor_scores_for_date(item, sessions, snapshots) for item in bucket_dates]
        factor_scores = {
            factor_key: clamp_score(average([summary["factor_scores"][factor_key] for summary in summaries]))
            for factor_key in FACTOR_KEYS
        }
        points.append(
            {
                "label": label,
                "period_key": bucket_start.isoformat(),
                "factor_scores": factor_scores,
                "total_score": clamp_score(average(list(factor_scores.values()))),
            }
        )

    return points


def calculate_streak(sessions: list[SessionInput], reference_date: date) -> int:
    daily_dates = {session.entry_date for session in sessions if session.period in {CheckInPeriod.MORNING, CheckInPeriod.NIGHT}}
    if not daily_dates:
        return 0

    streak = 0
    cursor = reference_date if reference_date in daily_dates else reference_date - timedelta(days=1)
    while cursor in daily_dates:
        streak += 1
        cursor -= timedelta(days=1)
    return streak
