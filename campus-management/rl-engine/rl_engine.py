
import random

# Campus operates Monday to Saturday.
DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
]

# Exact timetable slots. Breaks are excluded.
SLOTS = [
    ("08:00", "08:55"),
    ("08:55", "09:50"),
    ("10:10", "11:05"),
    ("11:05", "12:00"),
    ("13:00", "13:50"),
    ("13:50", "14:40"),
    ("14:55", "15:45"),
]

EPISODES = 500
LEARNING_RATE = 0.1
DISCOUNT_FACTOR = 0.9
EPSILON = 0.15


def overlaps(start_a, end_a, start_b, end_b):
    """Return True when two time intervals overlap."""
    return start_a < end_b and start_b < end_a


def get_room_name(room):
    """Get a usable classroom identifier."""
    return (
        room.get("name")
        or room.get("roomNumber")
        or room.get("classroom")
        or str(room.get("_id", ""))
    )


def is_valid_action(entry, action, scheduled):
    """Check faculty, classroom and batch constraints."""

    for other in scheduled:
        if other.get("day") != action["day"]:
            continue

        if not overlaps(
            action["startTime"],
            action["endTime"],
            other.get("startTime", ""),
            other.get("endTime", ""),
        ):
            continue

        # A faculty member cannot teach two classes simultaneously.
        faculty = entry.get("faculty")
        if faculty and faculty == other.get("faculty"):
            return False

        # A classroom cannot host two classes simultaneously.
        classroom = action.get("classroom")
        if classroom and classroom == other.get("classroom"):
            return False

        # A batch cannot attend two subjects simultaneously.
        same_batch = (
            entry.get("batch")
            and entry.get("batch") == other.get("batch")
            and entry.get("semester") == other.get("semester")
            and entry.get("department") == other.get("department")
        )

        if same_batch:
            return False

    return True


def train_q_learning(
    entries,
    classrooms,
    student_count=50,
    episodes=EPISODES,
    seed=None,
):
    """
    Assign timetable entries to days, time slots and rooms.

    Returns a dictionary containing the proposed schedule
    and the number of entries that could not be assigned.
    """

    if seed is not None:
        random.seed(seed)

    if not entries:
        return {
            "success": True,
            "algorithm": "Tabular Q-learning prototype",
            "entriesProcessed": 0,
            "assignedEntries": 0,
            "unassignedEntries": 0,
            "reward": 0,
            "schedule": [],
            "message": "No timetable entries to optimize.",
        }

    usable_rooms = [
        room for room in classrooms
        if int(room.get("capacity") or 0) >= student_count
        and get_room_name(room)
    ]

    if not usable_rooms:
        return {
            "success": False,
            "message": (
                f"No classroom found with capacity for "
                f"{student_count} students."
            ),
        }

    room_names = [get_room_name(room) for room in usable_rooms]

    actions = [
        {
            "day": day,
            "startTime": start,
            "endTime": end,
            "classroom": room,
        }
        for day in DAYS
        for start, end in SLOTS
        for room in room_names
    ]

    # Q-table: one action-value array per timetable entry.
    q_table = {
        str(index): [0.0] * len(actions)
        for index in range(len(entries))
    }

    best_schedule = []
    best_unassigned = len(entries)
    best_reward = float("-inf")

    for _ in range(max(1, episodes)):
        scheduled = []
        episode_reward = 0
        unassigned = 0

        # Try entries with faculty and batch constraints first.
        ordered_entries = sorted(
            enumerate(entries),
            key=lambda item: (
                bool(item[1].get("faculty")),
                bool(item[1].get("batch")),
            ),
            reverse=True,
        )

        for index, entry in ordered_entries:
            valid_indices = [
                i for i, action in enumerate(actions)
                if is_valid_action(entry, action, scheduled)
            ]

            if not valid_indices:
                unassigned += 1
                episode_reward -= 20
                continue

            q_values = q_table[str(index)]

            if random.random() < EPSILON:
                chosen_index = random.choice(valid_indices)
            else:
                chosen_index = max(
                    valid_indices,
                    key=lambda i: q_values[i],
                )

            chosen = actions[chosen_index]

            # Reward valid placement; penalize failed placement.
            reward = 12
            old_q = q_values[chosen_index]

            q_values[chosen_index] = old_q + LEARNING_RATE * (
                reward + DISCOUNT_FACTOR * 0 - old_q
            )

            scheduled.append({
                **entry,
                **chosen,
            })
            episode_reward += reward

        score = episode_reward - unassigned * 20

        if (
            score > best_reward
            or (
                score == best_reward
                and unassigned < best_unassigned
            )
        ):
            best_reward = score
            best_unassigned = unassigned
            best_schedule = scheduled.copy()

        if unassigned == 0:
            break

    return {
        "success": True,
        "algorithm": "Tabular Q-learning prototype",
        "episodes": max(1, episodes),
        "entriesProcessed": len(entries),
        "assignedEntries": len(best_schedule),
        "unassignedEntries": best_unassigned,
        "reward": round(best_reward, 2),
        "conflicts": 0,
        "days": DAYS,
        "slotsPerDay": len(SLOTS),
        "schedule": best_schedule,
        "message": (
            "Proposed schedule generated. "
            "Review it before applying changes."
        ),
    }
